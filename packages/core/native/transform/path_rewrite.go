package transform

import (
	"path/filepath"
	"sort"
	"strings"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimcore "github.com/microsoft/typescript-go/shim/core"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

type pathsRewriter struct {
	basePath    string
	outDir      string
	patterns    []pathsPattern
	rootDir     string
	sourceFiles map[string]string
}

type pathsPattern struct {
	pattern string
	targets []string
}

func newPathsRewriter(prog *driver.Program) *pathsRewriter {
	out := &pathsRewriter{sourceFiles: map[string]string{}}
	if prog == nil || prog.ParsedConfig == nil || prog.ParsedConfig.ParsedConfig == nil || prog.ParsedConfig.ParsedConfig.CompilerOptions == nil {
		return out
	}
	options := prog.ParsedConfig.ParsedConfig.CompilerOptions
	out.basePath = filepath.Clean(options.GetPathsBasePath(prog.Host.GetCurrentDirectory()))
	out.outDir = optionalPath(options.OutDir, prog.Host.GetCurrentDirectory())
	out.rootDir = optionalPath(options.RootDir, prog.Host.GetCurrentDirectory())
	files := prog.SourceFiles()
	if out.rootDir == "" {
		out.rootDir = commonSourceDir(files)
	}
	for _, file := range files {
		name := normalizePath(file.FileName())
		out.sourceFiles[name] = name
		out.sourceFiles[stripKnownSourceExtension(name)] = name
	}
	if options.Paths != nil {
		for pattern, targets := range options.Paths.Entries() {
			out.patterns = append(out.patterns, pathsPattern{
				pattern: pattern,
				targets: append([]string(nil), targets...),
			})
		}
	}
	sort.SliceStable(out.patterns, func(i, j int) bool {
		return patternRank(out.patterns[i].pattern) > patternRank(out.patterns[j].pattern)
	})
	return out
}

func (r *pathsRewriter) applyAll(files []*shimast.SourceFile) {
	if r == nil || len(r.patterns) == 0 {
		return
	}
	for _, file := range files {
		r.apply(file)
	}
}

func (r *pathsRewriter) apply(file *shimast.SourceFile) {
	if r == nil || file == nil || len(r.patterns) == 0 {
		return
	}
	visitModuleSpecifiers(file.AsNode(), func(lit *shimast.Node) {
		if lit == nil || lit.Kind != shimast.KindStringLiteral {
			return
		}
		spec := lit.Text()
		rewritten, ok := r.rewrite(file.FileName(), spec)
		if ok && rewritten != spec {
			lit.AsStringLiteral().Text = rewritten
			lit.Flags |= shimast.NodeFlagsSynthesized
			lit.Loc = shimcore.UndefinedTextRange()
		}
	})
}

func visitModuleSpecifiers(node *shimast.Node, visit func(*shimast.Node)) {
	if node == nil {
		return
	}
	switch node.Kind {
	case shimast.KindImportDeclaration:
		visit(node.AsImportDeclaration().ModuleSpecifier)
	case shimast.KindExportDeclaration:
		visit(node.AsExportDeclaration().ModuleSpecifier)
	case shimast.KindImportEqualsDeclaration:
		ref := node.AsImportEqualsDeclaration().ModuleReference
		if ref != nil && ref.Kind == shimast.KindExternalModuleReference {
			visit(ref.AsExternalModuleReference().Expression)
		}
	case shimast.KindImportType:
		arg := node.AsImportTypeNode().Argument
		if arg != nil && arg.Kind == shimast.KindLiteralType {
			visit(arg.AsLiteralTypeNode().Literal)
		}
	case shimast.KindModuleDeclaration:
		decl := node.AsModuleDeclaration()
		if decl != nil {
			visit(decl.Name())
		}
	case shimast.KindCallExpression:
		call := node.AsCallExpression()
		if isModuleSpecifierCall(call) && call.Arguments != nil && len(call.Arguments.Nodes) > 0 {
			visit(call.Arguments.Nodes[0])
		}
	}
	node.ForEachChild(func(child *shimast.Node) bool {
		visitModuleSpecifiers(child, visit)
		return false
	})
}

func isModuleSpecifierCall(call *shimast.CallExpression) bool {
	if call == nil || call.Expression == nil {
		return false
	}
	switch call.Expression.Kind {
	case shimast.KindImportKeyword:
		return true
	case shimast.KindIdentifier:
		return call.Expression.Text() == "require"
	default:
		return false
	}
}

func (r *pathsRewriter) rewrite(fromSource string, specifier string) (string, bool) {
	if specifier == "" || strings.HasPrefix(specifier, ".") || strings.HasPrefix(specifier, "/") {
		return specifier, false
	}
	targetSource, ok := r.resolveSource(specifier)
	if !ok {
		return specifier, false
	}
	fromOut := r.outputPathForSource(fromSource)
	targetOut := r.outputPathForSource(targetSource)
	if fromOut == "" || targetOut == "" {
		return specifier, false
	}
	rel, err := filepath.Rel(filepath.Dir(fromOut), targetOut)
	if err != nil {
		return specifier, false
	}
	rel = filepath.ToSlash(rel)
	if !strings.HasPrefix(rel, ".") {
		rel = "./" + rel
	}
	return rel, true
}

func (r *pathsRewriter) resolveSource(specifier string) (string, bool) {
	for _, pattern := range r.patterns {
		star, ok := matchPattern(pattern.pattern, specifier)
		if !ok {
			continue
		}
		for _, target := range pattern.targets {
			candidate := strings.Replace(target, "*", star, 1)
			resolved := normalizePath(filepath.Join(r.basePath, candidate))
			if source, ok := r.lookupSource(resolved); ok {
				return source, true
			}
		}
	}
	return "", false
}

func (r *pathsRewriter) lookupSource(candidate string) (string, bool) {
	if source, ok := r.sourceFiles[normalizePath(candidate)]; ok {
		return source, true
	}
	stem := stripKnownSourceExtension(normalizePath(candidate))
	if source, ok := r.sourceFiles[stem]; ok {
		return source, true
	}
	for _, ext := range []string{".ts", ".tsx", ".mts", ".cts"} {
		if source, ok := r.sourceFiles[stem+ext]; ok {
			return source, true
		}
	}
	for _, ext := range []string{".ts", ".tsx", ".mts", ".cts"} {
		if source, ok := r.sourceFiles[normalizePath(filepath.Join(stem, "index"+ext))]; ok {
			return source, true
		}
	}
	return "", false
}

func (r *pathsRewriter) outputPathForSource(source string) string {
	if r.outDir == "" || r.rootDir == "" {
		return ""
	}
	rel, err := filepath.Rel(r.rootDir, source)
	if err != nil || isOutsideRelativePath(rel) {
		return ""
	}
	return normalizePath(filepath.Join(r.outDir, replaceSourceExtension(rel, emittedJavaScriptExtension(rel))))
}

func emittedJavaScriptExtension(source string) string {
	switch strings.ToLower(filepath.Ext(source)) {
	case ".mts":
		return ".mjs"
	case ".cts":
		return ".cjs"
	default:
		return ".js"
	}
}

func matchPattern(pattern string, specifier string) (string, bool) {
	if !strings.Contains(pattern, "*") {
		return "", pattern == specifier
	}
	parts := strings.SplitN(pattern, "*", 2)
	if !strings.HasPrefix(specifier, parts[0]) || !strings.HasSuffix(specifier, parts[1]) {
		return "", false
	}
	return specifier[len(parts[0]) : len(specifier)-len(parts[1])], true
}

func patternRank(pattern string) int {
	return len(strings.ReplaceAll(pattern, "*", ""))
}

func optionalPath(value string, cwd string) string {
	if value == "" {
		return ""
	}
	if filepath.IsAbs(value) {
		return normalizePath(value)
	}
	return normalizePath(filepath.Join(cwd, value))
}

func commonSourceDir(files []*shimast.SourceFile) string {
	if len(files) == 0 {
		return ""
	}
	common := normalizePath(filepath.Dir(files[0].FileName()))
	for _, file := range files[1:] {
		dir := normalizePath(filepath.Dir(file.FileName()))
		for common != "" && !strings.HasPrefix(dir+"/", common+"/") {
			next := filepath.Dir(common)
			if next == common {
				return common
			}
			common = normalizePath(next)
		}
	}
	return common
}

func normalizePath(value string) string {
	if value == "" {
		return ""
	}
	return filepath.ToSlash(filepath.Clean(value))
}

func isOutsideRelativePath(rel string) bool {
	return rel == ".." || strings.HasPrefix(filepath.ToSlash(rel), "../")
}

func stripKnownSourceExtension(value string) string {
	lower := strings.ToLower(value)
	for _, ext := range []string{".d.ts", ".d.mts", ".d.cts", ".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"} {
		if strings.HasSuffix(lower, ext) {
			return value[:len(value)-len(ext)]
		}
	}
	return strings.TrimSuffix(value, filepath.Ext(value))
}

func replaceSourceExtension(value string, ext string) string {
	return stripKnownSourceExtension(filepath.ToSlash(value)) + ext
}
