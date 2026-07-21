package transform

import (
	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimprinter "github.com/microsoft/typescript-go/shim/printer"
	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/ttsc/packages/ttsc/driver"
	nativecontext "github.com/samchon/typia/packages/typia/native/core/context"
)

// nestiaCoreNodeTransform builds the @nestia/core AST-integration transformer for
// one emit run. It mirrors typia's transform.Transform / FileTransformer: per
// source file it allocates a shared ec-mode ImportProgrammer, rebuilds every
// nestia-core decorator call with its generated validator argument nodes (whose
// runtime references resolve to namespace imports tsgo's module-transform
// aliases), injects those imports, and normalizes the synthetic operator tokens
// typia's programmers leave nil. A diagnostic is appended for any site whose
// generation raises a (recovered) transform error.
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
		importer := nativecontext.NewImportProgrammer(nativecontext.ImportProgrammer_IOptions{
			InternalPrefix: "typia_transform_",
			Runtime:        "typia",
		})
		importer.SetEmitContext(ec)
		state := newNestiaCoreTransformState(prog, options)
		state.importer = importer
		state.ec = ec

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

		// Traverse with the emit EmitContext, not a standalone factory: every
		// ancestor node the visitor recreates to hold a rebuilt decorator call
		// gets an `original` link back to its parse-tree node, so tsgo's emit
		// resolver can recover the binder symbol when it marks linked references.
		// A plain factory drops that link, so tsgo's MarkLinkedReferences pass
		// nil-panics (and exported namespaces silently vanish). Mirrors typia's
		// FileTransformer emit-context traversal.
		var visitor *shimast.NodeVisitor
		visitor = ec.NewNodeVisitor(func(node *shimast.Node) *shimast.Node {
			if node == nil {
				return nil
			}
			if node.Kind == shimast.KindCallExpression {
				if updated, ok := replacements[node]; ok {
					// Link the rebuilt decorator call back to its parse-tree node and
					// keep visiting it through the emit EmitContext (like typia's
					// FileTransformer returns visitor.VisitEachChild(next)). Visiting
					// the substituted subtree is what wires the injected validator
					// nodes' parents and original links, so tsgo's emit resolver can
					// recover their binder symbols when it marks linked references —
					// returning the node raw leaves that subtree untracked and the
					// resolver nil-panics.
					ec.SetOriginal(updated.AsNode(), node)
					return visitor.VisitEachChild(updated.AsNode())
				}
			}
			return visitor.VisitEachChild(node)
		})
		visited := visitor.VisitNode(sf.AsNode())
		if visited == nil {
			return sf
		}
		result := visited.AsSourceFile()
		result = nestiaCoreInjectImports(result, importer.ToStatements(), ec)
		// The node path prints through tsgo's printer, which dereferences the
		// conditional ?/: operator tokens typia's programmers leave nil; the
		// so normalizeNestiaSyntheticTokens fills them before printing.
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
	typ := state.prog.Checker.GetTypeAtLocation(nestiaCoreOriginalNode(state.ec, node))
	for _, candidate := range candidates {
		// Hand typia the real callee node (e.g. `core.TypedBody`) as the modulo,
		// mirroring typia's own transformer (props.Expression.Expression). typia's
		// programmers read its source-span text via GetTextOfNode for the error
		// method label; a synthesized identifier has no source span and nil-panics,
		// so map back to the parse-tree callee when typia rebuilt this decorator.
		modulo := nestiaCoreOriginalNode(state.ec, candidate.call.Expression)
		nodes, ok, err := nestiaCoreParameterArgumentNodes(state.prog, state.importer, state.ec, state.options, candidate.call, modulo, candidate.kind, typ)
		if err != nil {
			addDiagnostic(nestiaCoreDiagnostic(nestiaCoreSiteFor(context.file, candidate.call, candidate.kind, candidate.segments), err.Error()))
			continue
		}
		if !ok {
			continue
		}
		replacements[candidate.call.AsNode()] = nestiaCoreAppendArgumentNodes(candidate.call, nodes, state.ec)
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
		// @WebSocketRoute carries no injected validator (it is not a method kind),
		// but its acceptor/driver parameter shapes are validated here, mirroring the
		// collection pass. Validate against the parse-tree method so
		// parameter type text resolves even when typia rebuilt this method.
		if len(canonical) != 0 && canonical[len(canonical)-1] == "WebSocketRoute" {
			for _, diag := range validateNestiaCoreWebSocketRoute(state.prog, context, nestiaCoreOriginalNode(state.ec, node), call, canonical) {
				addDiagnostic(diag)
			}
		}
		kind := nestiaCoreMethodKind(canonical)
		if kind == "" {
			continue
		}
		if kind == "McpRoute" {
			if nestiaCoreMcpRouteAlreadyTransformed(call) {
				continue
			}
		} else if nestiaCoreShouldSkipMethodDecorator(state.prog, call) {
			continue
		}
		candidates = append(candidates, candidate{call: call, segments: segments, kind: kind})
	}
	if len(candidates) == 0 {
		return
	}
	typ := NestiaCoreMethodReturnType(state.prog, nestiaCoreOriginalNode(state.ec, node))
	if typ == nil {
		return
	}
	for _, candidate := range candidates {
		if candidate.kind == "McpRoute" {
			generated, err := nestiaCoreMcpRouteArgumentNode(state.prog, state.importer, state.ec, state.options, context.file, nestiaCoreOriginalNode(state.ec, node), candidate.call, typ)
			if err != nil {
				addDiagnostic(nestiaCoreDiagnostic(nestiaCoreSiteFor(context.file, candidate.call, candidate.kind, candidate.segments), err.Error()))
				continue
			}
			replacements[candidate.call.AsNode()] = nestiaCoreReplaceArgumentNodes(candidate.call, []*shimast.Node{generated}, state.ec)
			continue
		}
		// Real callee node as modulo (see nestiaCoreCollectParameterReplacements).
		modulo := nestiaCoreOriginalNode(state.ec, candidate.call.Expression)
		generated, err := nestiaCoreMethodArgumentNode(state.prog, state.importer, state.ec, state.options, modulo, candidate.kind, typ)
		if err != nil {
			addDiagnostic(nestiaCoreDiagnostic(nestiaCoreSiteFor(context.file, candidate.call, candidate.kind, candidate.segments), err.Error()))
			continue
		}
		replacements[candidate.call.AsNode()] = nestiaCoreAppendArgumentNodes(candidate.call, []*shimast.Node{generated}, state.ec)
	}
}

// nestiaCoreOriginalNode returns the parse-tree node a (possibly synthetic) node
// was rebuilt from, so checker queries that need binder symbols or types resolve
// against the original. core runs after typia in the shared emit pass: when typia
// lowers a `typia.random<T>()` call that sits in a decorator argument or method
// body, it rebuilds the enclosing method (and its parameters) into synthetic
// nodes that carry no binder symbol. GetSignatureFromDeclaration /
// GetTypeAtLocation then nil-panic on them, and GetTextOfNode on a synthetic
// callee has no source span. ec.MostOriginal walks the original-link chain back
// to the parse node; it is a no-op for nodes core sees before typia touched them.
func nestiaCoreOriginalNode(ec *shimprinter.EmitContext, node *shimast.Node) *shimast.Node {
	if ec == nil || node == nil {
		return node
	}
	if original := ec.MostOriginal(node); original != nil {
		return original
	}
	return node
}

// nestiaCoreReplaceArgumentNodes rebuilds a decorator call with the generated
// nodes replacing every original argument.
func nestiaCoreReplaceArgumentNodes(call *shimast.CallExpression, replacements []*shimast.Node, ec *shimprinter.EmitContext) *shimast.CallExpression {
	f := nativecontext.EmitFactoryOf(nestiaCoreFactory, ec)
	updated := f.NewCallExpression(
		call.Expression,
		call.QuestionDotToken,
		call.TypeArguments,
		f.NewNodeList(replacements),
		call.AsNode().Flags,
	)
	return updated.AsCallExpression()
}

// nestiaCoreAppendArgumentNodes rebuilds a decorator call with the generated
// validator nodes appended after its original arguments.
func nestiaCoreAppendArgumentNodes(call *shimast.CallExpression, appended []*shimast.Node, ec *shimprinter.EmitContext) *shimast.CallExpression {
	f := nativecontext.EmitFactoryOf(nestiaCoreFactory, ec)
	existing := []*shimast.Node{}
	if call.Arguments != nil {
		existing = append(existing, call.Arguments.Nodes...)
	}
	args := make([]*shimast.Node, 0, len(existing)+len(appended))
	args = append(args, existing...)
	args = append(args, appended...)
	updated := f.NewCallExpression(
		call.Expression,
		call.QuestionDotToken,
		call.TypeArguments,
		f.NewNodeList(args),
		call.AsNode().Flags,
	)
	return updated.AsCallExpression()
}

// nestiaCoreInjectImports prepends the importer's namespace-import statements
// after any leading "use ..." prologue, mirroring typia's
// fileTransformer_inject_imports.
func nestiaCoreInjectImports(file *shimast.SourceFile, imports []*shimast.Node, ec *shimprinter.EmitContext) *shimast.SourceFile {
	if file == nil || len(imports) == 0 {
		return file
	}
	f := nativecontext.EmitFactoryOf(nestiaCoreFactory, ec)
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
	return f.UpdateSourceFile(
		file,
		f.NewNodeList(nodes),
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
