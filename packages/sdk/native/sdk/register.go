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

// sdkMetadataNamespace is the import alias the legacy (text/program-mutation)
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
// old plugin plans working, while the contributor collectors let the aggregate
// core host run SDK metadata rewrites without starting a second native backend.
func init() {
	driver.RegisterPlugin(linkedPlugin{})
	transform.RegisterBuildOutputRewriteCollector(collectSDKBuildOutputRewriter)
	transform.RegisterSourceRewriteCollector(collectSDKSourceRewriteMap)
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
// `require("@nestia/sdk")` and aliases the reference itself — no hand-rolled
// `__OperationMetadata` namespace and no text-splice.
//
// Core's build command wires this into `prog.EmitWithPluginTransformers`
// alongside the typia and core transforms, exactly as the typia build command
// wires `nativetransform.Transform`. A site-collection failure is returned as
// diagnostics; the returned transform is nil when there are no sites.
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
		for _, site := range fileSites {
			if site.Method == nil {
				continue
			}
			injectOperationMetadataDecoratorEC(ec, modSpec, site.Method, site.Metadata)
		}
		injectOperationMetadataImportEC(ec, modSpec, sf)
		return sf
	}, nil
}

func collectSDKBuildOutputRewriter(
	prog *driver.Program,
	plan plugin.Plan,
) (*transform.BuildOutputRewriter, []transform.Diagnostic) {
	if shouldRunSDKContributorTransform() == false {
		return nil, nil
	}
	plan.SDK = true
	set, diagnostics := collectNestiaSDKBuildRewrites(prog, plan)
	return &transform.BuildOutputRewriter{
		Len:   set.Len,
		Apply: set.Apply,
	}, diagnostics
}

func collectSDKSourceRewriteMap(
	prog *driver.Program,
	plan plugin.Plan,
	onlyFile string,
) (map[string][]transform.SourceRewrite, []transform.Diagnostic) {
	if shouldRunSDKContributorTransform() == false {
		return map[string][]transform.SourceRewrite{}, nil
	}
	plan.SDK = true
	return collectNestiaSDKSourceRewriteMap(prog, plan, onlyFile)
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
// method. Every site is a method that already carries `@nestia/core`
// decorators, so its modifier list is non-nil and can be mutated in place.
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
