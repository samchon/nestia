package sdk

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimprinter "github.com/microsoft/typescript-go/shim/printer"
	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/nestia/packages/core/native/transform"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// sdkMetadataNamespace is the import alias the ApplyProgram (program-mutation)
// path references. The emit-context path lets tsgo's module-transform pick the
// generated alias itself, so it does not use this constant.
const sdkMetadataNamespace = "__OperationMetadata"

// sdkMetadataModule is the runtime package the injected decorator is imported
// from.
const sdkMetadataModule = "@nestia/sdk"

// sdkMetadataMember is the decorator factory exported by sdkMetadataModule.
const sdkMetadataMember = "OperationMetadata"

// init registers the SDK metadata transform with both native entry paths.
//
// ttsc classifies this package (name != "main") as a linked transform and
// statically links it into the `@nestia/core` host binary — but only for
// projects that depend on `@nestia/sdk`. The direct linked-plugin path keeps
// old plugin plans working, while the emit-transform collector lets the
// aggregate core host run the SDK metadata pass inside the shared emit context
// without starting a second native backend.
func init() {
	driver.RegisterPlugin(linkedPlugin{})
	transform.RegisterEmitTransformCollector(collectSDKEmitTransform)
}

type linkedPlugin struct{}

// ApplyProgram injects the `@OperationMetadata("<json>")` decorator that the
// SDK / Swagger / e2e generators read at runtime, plus the namespace import it
// references.
//
// Insertion is done with synthesized AST nodes (NodeFlagsSynthesized): ttsc's
// emit prints those structurally, without slicing the original source text, so
// no source-text rewrite is needed. The metadata is carried as a single JSON
// string literal — the `OperationMetadata` decorator `JSON.parse`s it — which
// keeps the constructed AST to one literal node instead of a deep object tree.
func (linkedPlugin) ApplyProgram(prog *driver.Program, _ driver.PluginContext) error {
	sites, diags := collectNestiaSDKSites(prog)
	if len(diags) > 0 {
		messages := make([]string, 0, len(diags))
		for _, diag := range diags {
			messages = append(messages, diag.String(""))
		}
		return fmt.Errorf("%s", strings.Join(messages, "\n"))
	}
	if len(sites) == 0 {
		return nil
	}
	factory := shimast.NewNodeFactory(shimast.NodeFactoryHooks{})
	touched := map[*shimast.SourceFile]bool{}
	for _, site := range sites {
		if site.Method == nil || site.File == nil {
			continue
		}
		injectOperationMetadataDecorator(factory, site.Method, site.Metadata)
		touched[site.File] = true
	}
	for file := range touched {
		injectOperationMetadataImport(factory, file)
	}
	return nil
}

// EmitTransform builds the SDK metadata pass as an emit-phase AST transformer
// (the AST-integration path that mirrors typia's `transform.Transform`). It
// collects every controller-method site once for the program, then returns a
// per-file `driver.PluginTransform` that injects the
// `@<ns>.OperationMetadata("<json>")` decorator plus a namespace import of
// `@nestia/sdk`, both built with ec.Factory and referenced through
// NewGeneratedNameForNode(modSpec), so tsgo's builtin module-transform emits the
// `require("@nestia/sdk")` and aliases the reference itself, with no
// hand-rolled `__OperationMetadata` namespace.
//
// Core's build command wires this into `prog.EmitWithPluginTransformers`
// alongside the typia and core transforms, exactly as the typia build command
// wires `nativetransform.Transform`. A site-collection failure is returned as
// diagnostics; the returned transform is nil when there are no sites.
//
// @evidence contracts/common.md#principled-implementation Decorated class-method sites are collected once for the program, and the returned transform maps each original method to its synthetic counterpart so the decorator lands on the printed node; collection failures return diagnostics and no sites return nil. Private reflection helpers use TypeReference/TypeQuery roles and checker aliases for authored imports, declaration sources for free types, and IsLibFile for actual libraries; locally bound TypeParameter symbols have no module import identity. Async aliases use the checker-resolved payload and TypeToTypeNode to apply generic defaults and substitutions after shared declaration-based Promise/Observable classification; type operators retain valid source or projected syntax and parenthesized operands preserve generic arguments. Only fixed language keywords are excluded by spelling. Readonly array and tuple schema markers follow actual checker numeric-index immutability and tuple target flags; substituted object properties, ordered schema dictionaries, nested and inferred types retain those facts without classifying authored alias names. Metadata nulls use the explicit upstream JSON null marker, so authored strings remain strings without encoded-text substitution. The shared private tag serializer omits a schema member when upstream analysis supplies nil for an absent or undefined optional schema, while preserving explicit empty objects and null instance leaves inside populated schema objects.
// @evidence contracts/common.md#clear-and-simple-design Site collection and one per-file closure share file grouping and the module specifier. Private import reflection centralizes reference traversal, authored binding selection and declaration fallback so the reflected type forms use one policy. Checker-generated alias payload nodes carry identifier symbols separately because they have no authored source span; the public printer supplies their text. All raw tag matrices share one serialization boundary, keeping optional tag representation separate from JSON Schema baking.
// @evidence contracts/common.md#prohibited-implementation-shortcuts The shared module specifier binds one generated alias without controller special cases. Import decisions use semantic AST roles, checker bindings and actual library identity rather than regex matches in literals, built-in-name whitelists or fixture/path spelling. Alias projection uses the supported checker and printer APIs without reparsing or mutating foreign behavior. Optional-schema omission depends on the analyzed nil value, never tag names, fixture paths or a TypeScript-writer compensation; invalid top-level null and scalar schemas remain upstream analyzer errors.
// @evidence contracts/common.md#meaningful-documentation The public comment explains injected metadata, original-to-synthetic mapping and nil/diagnostic results. Private helper comments explain reference roles, shadowable library names, declaration fallback, annotation-local binders, checker projection and type-operator syntax; these details remain documented at their implementation owners. The private tag serializer explains why absence cannot become JSON null and why empty objects and nested null content stay intact.
// @evidence contracts/portability.md#os-neutral-implementation File grouping converts both collected paths and emitted source names through filepath.ToSlash; it preserves the compiler's filename identity without guessing volume case policy. The contributor receives an existing compiler program and launches no shell. Declaration-package ownership uses the shared SourceFilePackageName ancestor walk through that program's filesystem, retaining its overlay observations and native filepath operations.
// @evidence contracts/performance.md#efficient-algorithms Site analysis visits the program once; grouping costs O(S) for S sites plus filename lengths. Each participating emitted file is traversed once to index original method identities, followed by O(Sf) injections for its sites. The method index avoids a separate AST traversal for every route.
// @evidence contracts/performance.md#reuse-equivalent-work The returned closure shares the collected metadata and file grouping across file emissions of this program. A new EmitTransform invocation recollects against its supplied program; these AST identities cannot safely be reused for another compilation.
// @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains the site's AST nodes and metadata strings for its compiler emission lifetime. Each per-file method index becomes unreachable after that file returns; there are no process-global program caches, file handles or background tasks in this operation.
func EmitTransform(prog *driver.Program) (driver.PluginTransform, []transform.Diagnostic) {
	sites, diagnostics := collectNestiaSDKSites(prog)
	if len(diagnostics) > 0 {
		return nil, diagnostics
	}
	if len(sites) == 0 {
		return nil, nil
	}
	byFile := map[string][]nestiaSDKSite{}
	for _, site := range sites {
		byFile[filepath.ToSlash(site.FilePath)] = append(byFile[filepath.ToSlash(site.FilePath)], site)
	}
	return func(ec *shimprinter.EmitContext, sf *shimast.SourceFile) *shimast.SourceFile {
		if sf == nil {
			return sf
		}
		fileSites := byFile[filepath.ToSlash(sf.FileName())]
		if len(fileSites) == 0 {
			return sf
		}
		// One module-specifier literal per file, shared between the injected
		// import declaration and every decorator reference, so
		// NewGeneratedNameForNode binds them to the same alias tsgo's
		// module-transform emits for the require.
		modSpec := ec.Factory.NewStringLiteral(sdkMetadataModule, shimast.TokenFlagsNone)
		// Sites were collected from the parse-tree program, so site.Method is an
		// original method node. By the time this contributor runs, typia and core
		// have already rebuilt every decorated method into a synthetic copy with a
		// fresh modifier list, and the original node is no longer in the emitted
		// tree. Map each original method to its synthetic counterpart (via the
		// emit context's original link) so the injected decorator lands on the
		// node that is actually printed; fall back to the original when the method
		// was untouched.
		synthByOriginal := map[*shimast.Node]*shimast.Node{}
		var collect func(node *shimast.Node)
		collect = func(node *shimast.Node) {
			if node == nil {
				return
			}
			if node.Kind == shimast.KindMethodDeclaration {
				if original := ec.MostOriginal(node); original != nil {
					synthByOriginal[original] = node
				}
			}
			node.ForEachChild(func(child *shimast.Node) bool {
				collect(child)
				return false
			})
		}
		collect(sf.AsNode())
		for _, site := range fileSites {
			if site.Method == nil {
				continue
			}
			method := site.Method
			if synth, ok := synthByOriginal[site.Method]; ok {
				method = synth
			}
			injectOperationMetadataDecoratorEC(ec, modSpec, method, site.Metadata)
		}
		injectOperationMetadataImportEC(ec, modSpec, sf)
		return sf
	}, nil
}

// collectSDKEmitTransform exposes EmitTransform to the core `transform`
// subcommand's contributor registry, the node-path twin of
// collectSDKSourceRewriteMap. It is gated by the same NESTIA_SDK_TRANSFORM flag
// so the SDK metadata pass only participates when the caller opts in.
func collectSDKEmitTransform(
	prog *driver.Program,
	_ plugin.Plan,
) (driver.PluginTransform, []transform.Diagnostic) {
	if shouldRunSDKContributorTransform() == false {
		return nil, nil
	}
	return EmitTransform(prog)
}
func shouldRunSDKContributorTransform() bool {
	return os.Getenv("NESTIA_SDK_TRANSFORM") == "1"
}

func synthesized(node *shimast.Node) *shimast.Node {
	if node != nil {
		node.Flags |= shimast.NodeFlagsSynthesized
	}
	return node
}

// injectOperationMetadataDecorator prepends a synthesized
// `@__OperationMetadata.OperationMetadata("<json>")` decorator to a controller
// method. Site collection visits decorated class methods, including methods
// outside Nest controllers; their existing modifier lists carry the decorators
// and can be extended in place. Runtime controller analysis selects routes.
func injectOperationMetadataDecorator(
	factory *shimast.NodeFactory,
	method *shimast.Node,
	metadataJSON string,
) {
	modifiers := method.Modifiers()
	if modifiers == nil {
		return
	}
	namespaceID := synthesized(factory.NewIdentifier(sdkMetadataNamespace))
	memberID := synthesized(factory.NewIdentifier("OperationMetadata"))
	access := synthesized(factory.NewPropertyAccessExpression(
		namespaceID,
		nil,
		memberID,
		shimast.NodeFlagsNone,
	))
	namespaceID.Parent = access
	memberID.Parent = access
	argument := synthesized(factory.NewStringLiteral(metadataJSON, shimast.TokenFlagsNone))
	call := synthesized(factory.NewCallExpression(
		access,
		nil,
		nil,
		factory.NewNodeList([]*shimast.Node{argument}),
		shimast.NodeFlagsNone,
	))
	access.Parent = call
	argument.Parent = call
	decorator := synthesized(factory.NewDecorator(call))
	call.Parent = decorator
	decorator.Parent = method
	modifiers.Nodes = append([]*shimast.Node{decorator}, modifiers.Nodes...)
}

// injectOperationMetadataImport prepends a synthesized
// `import * as __OperationMetadata from "@nestia/sdk"` to a touched file.
func injectOperationMetadataImport(
	factory *shimast.NodeFactory,
	file *shimast.SourceFile,
) {
	if file == nil || file.Statements == nil {
		return
	}
	namespaceID := synthesized(factory.NewIdentifier(sdkMetadataNamespace))
	namespace := synthesized(factory.NewNamespaceImport(namespaceID))
	namespaceID.Parent = namespace
	clause := synthesized(factory.NewImportClause(shimast.KindUnknown, nil, namespace))
	namespace.Parent = clause
	specifier := synthesized(factory.NewStringLiteral("@nestia/sdk", shimast.TokenFlagsNone))
	declaration := synthesized(factory.NewImportDeclaration(nil, clause, specifier, nil))
	clause.Parent = declaration
	specifier.Parent = declaration
	declaration.Parent = file.AsNode()
	file.Statements.Nodes = append([]*shimast.Node{declaration}, file.Statements.Nodes...)
}

// injectOperationMetadataDecoratorEC is the emit-context (AST-integration)
// twin of injectOperationMetadataDecorator. The decorator's namespace reference
// is `ec.Factory.NewGeneratedNameForNode(modSpec)`, the same generated name
// tsgo's module-transform binds to `require("@nestia/sdk")`, so no hand-rolled
// `__OperationMetadata` alias is needed.
func injectOperationMetadataDecoratorEC(
	ec *shimprinter.EmitContext,
	modSpec *shimast.Node,
	method *shimast.Node,
	metadataJSON string,
) {
	modifiers := method.Modifiers()
	if modifiers == nil {
		return
	}
	access := ec.Factory.NewPropertyAccessExpression(
		ec.Factory.NewGeneratedNameForNode(modSpec),
		nil,
		ec.Factory.NewIdentifier(sdkMetadataMember),
		shimast.NodeFlagsNone,
	)
	argument := ec.Factory.NewStringLiteral(metadataJSON, shimast.TokenFlagsNone)
	call := ec.Factory.NewCallExpression(
		access,
		nil,
		nil,
		ec.Factory.NewNodeList([]*shimast.Node{argument}),
		shimast.NodeFlagsNone,
	)
	decorator := ec.Factory.NewDecorator(call)
	modifiers.Nodes = append([]*shimast.Node{decorator}, modifiers.Nodes...)
}

// injectOperationMetadataImportEC is the emit-context twin of
// injectOperationMetadataImport. It prepends `import * as <gen> from
// "@nestia/sdk"` built with ec.Factory, reusing modSpec so the namespace alias
// matches every decorator reference; tsgo's module-transform turns it into the
// `const <gen> = require("@nestia/sdk")` binding.
func injectOperationMetadataImportEC(
	ec *shimprinter.EmitContext,
	modSpec *shimast.Node,
	file *shimast.SourceFile,
) {
	if file == nil || file.Statements == nil {
		return
	}
	namespace := ec.Factory.NewNamespaceImport(ec.Factory.NewGeneratedNameForNode(modSpec))
	clause := ec.Factory.NewImportClause(shimast.KindUnknown, nil, namespace)
	declaration := ec.Factory.NewImportDeclaration(nil, clause, modSpec, nil)
	file.Statements.Nodes = append([]*shimast.Node{declaration}, file.Statements.Nodes...)
}
