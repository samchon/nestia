package main

import (
	"path/filepath"
	"strings"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimchecker "github.com/microsoft/typescript-go/shim/checker"
	typiaadapter "github.com/samchon/typia/packages/typia/native/adapter"
)

type nestiaTypiaImportRoot struct {
	module string
}

func collectNestiaTypiaCallSites(files []*shimast.SourceFile, checker *shimchecker.Checker) []typiaadapter.CallSite {
	sites := []typiaadapter.CallSite{}
	for _, file := range files {
		if file == nil || file.IsDeclarationFile {
			continue
		}
		roots, fallback := nestiaTypiaImportRoots(file)
		if len(roots) == 0 {
			if fallback {
				sites = append(sites, typiaadapter.CollectCallSites([]*shimast.SourceFile{file}, checker)...)
			}
			continue
		}
		file.ForEachChild(func(node *shimast.Node) bool {
			visitNestiaTypiaCallSite(file, checker, roots, node, &sites)
			return false
		})
	}
	return sites
}

func visitNestiaTypiaCallSite(
	file *shimast.SourceFile,
	checker *shimchecker.Checker,
	roots map[string]nestiaTypiaImportRoot,
	node *shimast.Node,
	sites *[]typiaadapter.CallSite,
) {
	if node == nil {
		return
	}
	if node.Kind == shimast.KindCallExpression {
		call := node.AsCallExpression()
		if call != nil && nestiaTypiaCallLooksPossible(call, roots) {
			if site, ok := tryNestiaTypiaCallSite(file, checker, node); ok {
				*sites = append(*sites, site)
			}
		}
	}
	node.ForEachChild(func(child *shimast.Node) bool {
		visitNestiaTypiaCallSite(file, checker, roots, child, sites)
		return false
	})
}

func nestiaTypiaImportRoots(file *shimast.SourceFile) (map[string]nestiaTypiaImportRoot, bool) {
	roots := map[string]nestiaTypiaImportRoot{}
	fallback := false
	if file == nil || file.Statements == nil {
		return roots, fallback
	}
	for _, stmt := range file.Statements.Nodes {
		if stmt == nil || stmt.Kind != shimast.KindImportDeclaration {
			continue
		}
		decl := stmt.AsImportDeclaration()
		if decl == nil || decl.ImportClause == nil || decl.ModuleSpecifier == nil || decl.ModuleSpecifier.Kind != shimast.KindStringLiteral {
			continue
		}
		moduleText := decl.ModuleSpecifier.Text()
		module, ok := nestiaTypiaImportModule(moduleText)
		if ok == false {
			continue
		}
		clause := decl.ImportClause.AsImportClause()
		if clause == nil || clause.PhaseModifier == shimast.KindTypeKeyword {
			continue
		}
		if name := clause.Name(); name != nil {
			roots[name.Text()] = nestiaTypiaImportRoot{module: module}
		}
		if clause.NamedBindings == nil {
			continue
		}
		if clause.NamedBindings.Kind == shimast.KindNamespaceImport {
			if name := clause.NamedBindings.Name(); name != nil {
				roots[name.Text()] = nestiaTypiaImportRoot{module: module}
			}
			continue
		}
		if clause.NamedBindings.Kind != shimast.KindNamedImports {
			continue
		}
		named := clause.NamedBindings.AsNamedImports()
		if named == nil || named.Elements == nil {
			continue
		}
		for _, elem := range named.Elements.Nodes {
			if elem == nil {
				continue
			}
			spec := elem.AsImportSpecifier()
			if spec == nil || spec.IsTypeOnly {
				continue
			}
			name := spec.Name()
			if name == nil {
				continue
			}
			imported := name.Text()
			if spec.PropertyName != nil {
				imported = spec.PropertyName.Text()
			}
			if module == "" {
				if nestiaTypiaKnownModule(imported) == false {
					continue
				}
				roots[name.Text()] = nestiaTypiaImportRoot{module: imported}
			} else {
				roots[name.Text()] = nestiaTypiaImportRoot{module: module}
			}
		}
	}
	return roots, fallback
}

func nestiaTypiaImportModule(specifier string) (string, bool) {
	switch specifier {
	case "typia":
		return "", true
	}
	for _, prefix := range []string{"typia/lib/", "typia/src/"} {
		if strings.HasPrefix(specifier, prefix) {
			name := strings.TrimPrefix(specifier, prefix)
			if strings.Contains(name, "/") || nestiaTypiaKnownModule(name) == false {
				return "", false
			}
			return name, true
		}
	}
	return "", false
}

func nestiaTypiaKnownModule(name string) bool {
	switch name {
	case "functional", "http", "json", "llm", "misc", "module", "notations", "protobuf", "reflect":
		return true
	default:
		return false
	}
}

func nestiaTypiaCallLooksPossible(call *shimast.CallExpression, roots map[string]nestiaTypiaImportRoot) bool {
	root, parts, ok := nestiaTypiaCallSegments(call)
	if ok == false {
		return false
	}
	info, ok := roots[root]
	if ok == false || len(parts) == 0 {
		return false
	}
	if info.module != "" {
		return true
	}
	if len(parts) == 1 {
		return true
	}
	return nestiaTypiaKnownModule(parts[0])
}

func nestiaTypiaCallSegments(call *shimast.CallExpression) (string, []string, bool) {
	if call == nil {
		return "", nil, false
	}
	expression := call.Expression
	parts := []string{}
	for expression != nil && expression.Kind == shimast.KindPropertyAccessExpression {
		property := expression.AsPropertyAccessExpression()
		if property == nil {
			return "", nil, false
		}
		name := property.Name()
		if name == nil || name.Kind != shimast.KindIdentifier {
			return "", nil, false
		}
		id := name.AsIdentifier()
		if id == nil || id.Text == "" {
			return "", nil, false
		}
		parts = append([]string{id.Text}, parts...)
		expression = property.Expression
	}
	if expression == nil || expression.Kind != shimast.KindIdentifier {
		return "", nil, false
	}
	root := expression.AsIdentifier()
	if root == nil || root.Text == "" {
		return "", nil, false
	}
	return root.Text, parts, true
}

func tryNestiaTypiaCallSite(file *shimast.SourceFile, checker *shimchecker.Checker, node *shimast.Node) (typiaadapter.CallSite, bool) {
	if checker == nil {
		return typiaadapter.CallSite{}, false
	}
	call := node.AsCallExpression()
	if call == nil {
		return typiaadapter.CallSite{}, false
	}
	signature := checker.GetResolvedSignature(node)
	if signature == nil {
		return typiaadapter.CallSite{}, false
	}
	declaration := signature.Declaration()
	if declaration == nil {
		return typiaadapter.CallSite{}, false
	}
	sourceFile := shimast.GetSourceFileOfNode(declaration)
	if sourceFile == nil {
		return typiaadapter.CallSite{}, false
	}
	module, ok := nestiaTypiaMatchModule(sourceFile.FileName())
	if !ok {
		return typiaadapter.CallSite{}, false
	}
	method := nestiaTypiaCallSiteMethodName(checker, declaration, call)
	if method == "" {
		return typiaadapter.CallSite{}, false
	}
	root, namespaces, ok := nestiaTypiaExtractRootAndNamespaces(call, method)
	if !ok {
		return typiaadapter.CallSite{}, false
	}
	return typiaadapter.CallSite{
		File:       file,
		FilePath:   file.FileName(),
		Module:     module,
		Method:     method,
		Call:       call,
		RootName:   root,
		Namespaces: namespaces,
	}, true
}

func nestiaTypiaMatchModule(location string) (string, bool) {
	location = filepath.ToSlash(location)
	for _, suffix := range []string{".d.ts", ".ts"} {
		for _, middle := range []string{"typia/lib/", "typia/src/", "packages/typia/src/"} {
			index := strings.LastIndex(location, middle)
			if index < 0 {
				continue
			}
			name := location[index+len(middle):]
			if !strings.HasSuffix(name, suffix) {
				continue
			}
			name = strings.TrimSuffix(name, suffix)
			if strings.Contains(name, "/") {
				continue
			}
			return name, true
		}
	}
	return "", false
}

func nestiaTypiaCallSiteMethodName(checker *shimchecker.Checker, declaration *shimast.Node, call *shimast.CallExpression) string {
	if name := declaration.Name(); name != nil {
		if symbol := checker.GetSymbolAtLocation(name); symbol != nil && symbol.Name != "" {
			return symbol.Name
		}
		if name.Kind == shimast.KindIdentifier {
			if id := name.AsIdentifier(); id != nil {
				return id.Text
			}
		}
	}
	if call.Expression != nil && call.Expression.Kind == shimast.KindPropertyAccessExpression {
		if property := call.Expression.AsPropertyAccessExpression(); property != nil {
			if name := property.Name(); name != nil && name.Kind == shimast.KindIdentifier {
				if id := name.AsIdentifier(); id != nil {
					return id.Text
				}
			}
		}
	}
	return ""
}

func nestiaTypiaExtractRootAndNamespaces(call *shimast.CallExpression, method string) (string, []string, bool) {
	expression := call.Expression
	segments := []string{}
	for expression != nil && expression.Kind == shimast.KindPropertyAccessExpression {
		property := expression.AsPropertyAccessExpression()
		if property == nil {
			break
		}
		name := property.Name()
		if name == nil || name.Kind != shimast.KindIdentifier {
			return "", nil, false
		}
		id := name.AsIdentifier()
		if id == nil || id.Text == "" {
			return "", nil, false
		}
		segments = append([]string{id.Text}, segments...)
		expression = property.Expression
	}
	if expression == nil || expression.Kind != shimast.KindIdentifier {
		return "", nil, false
	}
	root := expression.AsIdentifier()
	if root == nil || root.Text == "" || len(segments) == 0 {
		return "", nil, false
	}
	if segments[len(segments)-1] != method {
		return "", nil, false
	}
	return root.Text, segments[:len(segments)-1], true
}
