package transform

import (
	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimprinter "github.com/microsoft/typescript-go/shim/printer"
	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/ttsc/packages/ttsc/driver"
	nativeprogrammers "github.com/samchon/typia/packages/typia/native/core/programmers"
)

// nestiaCoreNodeTransform builds the @nestia/core AST-integration transformer for
// one emit run. It mirrors typia's transform.Transform / FileTransformer: per
// source file it allocates a shared ec-mode ImportProgrammer, rebuilds every
// nestia-core decorator call with its generated validator argument nodes (whose
// runtime references resolve to namespace imports tsgo's module-transform
// aliases), injects those imports, and normalizes the synthetic operator tokens
// typia's programmers leave nil. A diagnostic is appended for any site whose
// generation raises a (recovered) transform error, matching the legacy text
// path's swallow-and-report behavior.
//
// addDiagnostic receives one entry per failed site; the build command turns a
// non-empty diagnostic slice into a non-zero exit.
func nestiaCoreNodeTransform(
	prog *driver.Program,
	plan plugin.Plan,
	addDiagnostic func(Diagnostic),
) driver.PluginTransform {
	if plan.Core == false {
		return func(_ *shimprinter.EmitContext, sf *shimast.SourceFile) *shimast.SourceFile {
			return sf
		}
	}
	options := readNestiaCoreOptions(plan)
	strictReported := false
	return func(ec *shimprinter.EmitContext, sf *shimast.SourceFile) *shimast.SourceFile {
		if sf == nil || sf.IsDeclarationFile {
			return sf
		}
		if nestiaCoreStrictMode(prog) == false && strictReported == false {
			strictReported = true
			addDiagnostic(nestiaCoreGlobalDiagnostic("@nestia/core", "strict mode is required."))
		}
		importer := nativeprogrammers.NewImportProgrammer(nativeprogrammers.ImportProgrammer_IOptions{
			InternalPrefix: "typia_transform_",
			Runtime:        "typia",
		})
		importer.SetEmitContext(ec)
		state := newNestiaCoreTransformState(prog, options)
		state.importer = importer

		replacements := map[*shimast.Node]*shimast.CallExpression{}
		context := newNestiaCoreFileContext(sf)
		sf.ForEachChild(func(node *shimast.Node) bool {
			nestiaCoreCollectNodeReplacements(state, context, node, replacements, addDiagnostic)
			return false
		})
		if len(replacements) == 0 {
			// Nothing rewritten: no imports were injected, so leave the file as-is
			// (the shared typia transform pass handles any typia call sites).
			return sf
		}

		factory := nestiaCoreFactory
		var visitor *shimast.NodeVisitor
		visitor = shimast.NewNodeVisitor(func(node *shimast.Node) *shimast.Node {
			if node == nil {
				return nil
			}
			if node.Kind == shimast.KindCallExpression {
				if updated, ok := replacements[node]; ok {
					return updated.AsNode()
				}
			}
			return visitor.VisitEachChild(node)
		}, factory, shimast.NodeVisitorHooks{})
		visited := visitor.VisitNode(sf.AsNode())
		if visited == nil {
			return sf
		}
		result := visited.AsSourceFile()
		result = nestiaCoreInjectImports(result, importer.ToStatements())
		// The node path prints through tsgo's printer, which dereferences the
		// conditional ?/: operator tokens typia's programmers leave nil; the
		// legacy text path filled them via normalizeNestiaSyntheticTokens before
		// printing, so do the same here.
		normalizeNestiaSyntheticTokens(result.AsNode())
		return result
	}
}

// nestiaCoreCollectNodeReplacements walks a node looking for nestia-core
// parameter / method decorator calls. For each, it generates the appended
// validator argument nodes via the shared ec-importer and records a rebuilt
// CallExpression keyed by the original decorator call node, for the visitor to
// substitute.
func nestiaCoreCollectNodeReplacements(
	state *nestiaCoreTransformState,
	context nestiaCoreFileContext,
	node *shimast.Node,
	replacements map[*shimast.Node]*shimast.CallExpression,
	addDiagnostic func(Diagnostic),
) {
	if node == nil {
		return
	}
	switch node.Kind {
	case shimast.KindParameter:
		nestiaCoreCollectParameterReplacements(state, context, node, replacements, addDiagnostic)
	case shimast.KindMethodDeclaration:
		nestiaCoreCollectMethodReplacements(state, context, node, replacements, addDiagnostic)
	}
	node.ForEachChild(func(child *shimast.Node) bool {
		nestiaCoreCollectNodeReplacements(state, context, child, replacements, addDiagnostic)
		return false
	})
}

func nestiaCoreCollectParameterReplacements(
	state *nestiaCoreTransformState,
	context nestiaCoreFileContext,
	node *shimast.Node,
	replacements map[*shimast.Node]*shimast.CallExpression,
	addDiagnostic func(Diagnostic),
) {
	decorators := node.Decorators()
	if len(decorators) == 0 {
		return
	}
	type candidate struct {
		call     *shimast.CallExpression
		segments []string
		kind     string
	}
	candidates := []candidate{}
	for _, decorator := range decorators {
		call, segments, ok := nestiaCoreRawDecoratorCall(decorator)
		if !ok {
			continue
		}
		canonical := nestiaCoreCanonicalSegments(context, segments)
		kind := nestiaCoreParameterKind(canonical)
		if kind == "" || nestiaCoreDecoratorReference(state.prog, context, decorator, segments, canonical) == false {
			continue
		}
		candidates = append(candidates, candidate{call: call, segments: segments, kind: kind})
	}
	if len(candidates) == 0 {
		return
	}
	typ := state.prog.Checker.GetTypeAtLocation(node)
	for _, candidate := range candidates {
		modulo := nestiaCoreModuloNode(candidate.call.Expression)
		nodes, ok, err := nestiaCoreParameterArgumentNodes(state.prog, state.importer, state.options, candidate.call, modulo, candidate.kind, typ)
		if err != nil {
			addDiagnostic(nestiaCoreDiagnostic(nestiaCoreSiteFor(context.file, candidate.call, candidate.kind, candidate.segments), err.Error()))
			continue
		}
		if !ok {
			continue
		}
		replacements[candidate.call.AsNode()] = nestiaCoreAppendArgumentNodes(candidate.call, nodes)
	}
}

func nestiaCoreCollectMethodReplacements(
	state *nestiaCoreTransformState,
	context nestiaCoreFileContext,
	node *shimast.Node,
	replacements map[*shimast.Node]*shimast.CallExpression,
	addDiagnostic func(Diagnostic),
) {
	decorators := node.Decorators()
	if len(decorators) == 0 {
		return
	}
	type candidate struct {
		call     *shimast.CallExpression
		segments []string
		kind     string
	}
	candidates := []candidate{}
	for _, decorator := range decorators {
		call, segments, ok := nestiaCoreRawDecoratorCall(decorator)
		if !ok {
			continue
		}
		canonical := nestiaCoreCanonicalSegments(context, segments)
		if nestiaCoreDecoratorReference(state.prog, context, decorator, segments, canonical) == false {
			continue
		}
		kind := nestiaCoreMethodKind(canonical)
		if kind == "" || nestiaCoreShouldSkipMethodDecorator(state.prog, call) {
			continue
		}
		candidates = append(candidates, candidate{call: call, segments: segments, kind: kind})
	}
	if len(candidates) == 0 {
		return
	}
	typ := NestiaCoreMethodReturnType(state.prog, node)
	if typ == nil {
		return
	}
	for _, candidate := range candidates {
		modulo := nestiaCoreModuloNode(candidate.call.Expression)
		generated, err := nestiaCoreMethodArgumentNode(state.prog, state.importer, state.options, modulo, candidate.kind, typ)
		if err != nil {
			addDiagnostic(nestiaCoreDiagnostic(nestiaCoreSiteFor(context.file, candidate.call, candidate.kind, candidate.segments), err.Error()))
			continue
		}
		replacements[candidate.call.AsNode()] = nestiaCoreAppendArgumentNodes(candidate.call, []*shimast.Node{generated})
	}
}

// nestiaCoreAppendArgumentNodes rebuilds a decorator call with the generated
// validator nodes appended after its original arguments.
func nestiaCoreAppendArgumentNodes(call *shimast.CallExpression, appended []*shimast.Node) *shimast.CallExpression {
	existing := []*shimast.Node{}
	if call.Arguments != nil {
		existing = append(existing, call.Arguments.Nodes...)
	}
	args := make([]*shimast.Node, 0, len(existing)+len(appended))
	args = append(args, existing...)
	args = append(args, appended...)
	updated := nestiaCoreFactory.NewCallExpression(
		call.Expression,
		call.QuestionDotToken,
		call.TypeArguments,
		nestiaCoreFactory.NewNodeList(args),
		call.AsNode().Flags,
	)
	return updated.AsCallExpression()
}

// nestiaCoreInjectImports prepends the importer's namespace-import statements
// after any leading "use ..." prologue, mirroring typia's
// fileTransformer_inject_imports.
func nestiaCoreInjectImports(file *shimast.SourceFile, imports []*shimast.Node) *shimast.SourceFile {
	if file == nil || len(imports) == 0 {
		return file
	}
	index := 0
	for ; index < len(file.Statements.Nodes); index++ {
		stmt := file.Statements.Nodes[index]
		if stmt == nil || stmt.Kind != shimast.KindExpressionStatement {
			break
		}
		expression := stmt.AsExpressionStatement().Expression
		if expression == nil || expression.Kind != shimast.KindStringLiteral {
			break
		}
		if text := expression.AsStringLiteral().Text; len(text) < 4 || text[:4] != "use " {
			break
		}
	}
	nodes := make([]*shimast.Node, 0, len(file.Statements.Nodes)+len(imports))
	nodes = append(nodes, file.Statements.Nodes[:index]...)
	nodes = append(nodes, imports...)
	nodes = append(nodes, file.Statements.Nodes[index:]...)
	return nestiaCoreFactory.UpdateSourceFile(
		file,
		nestiaCoreFactory.NewNodeList(nodes),
		file.EndOfFileToken,
	).AsSourceFile()
}

func nestiaCoreSiteFor(file *shimast.SourceFile, call *shimast.CallExpression, kind string, segments []string) nestiaCoreSite {
	return nestiaCoreSite{
		File:     file,
		FilePath: file.FileName(),
		Call:     call,
		Kind:     kind,
		Segments: segments,
	}
}
