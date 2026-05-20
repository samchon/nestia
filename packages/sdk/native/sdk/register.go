package sdk

import (
	"fmt"
	"os"
	"strings"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/nestia/packages/core/native/transform"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// sdkMetadataNamespace is the import alias the injected decorator references.
const sdkMetadataNamespace = "__OperationMetadata"

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
