package test

import (
	"path/filepath"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// sdkLinkedPluginsJSON is the bare TTSC_LINKED_PLUGINS_JSON payload (no env-name
// prefix) naming the single SDK contributor the driver runs through ApplyProgram.
const sdkLinkedPluginsJSON = `[{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]`

// Verifies the linked-plugin entry point (linkedPlugin.ApplyProgram) injects the
// @OperationMetadata decorator and namespace import as synthesized AST nodes when
// the ttsc driver activates the SDK contributor through TTSC_LINKED_PLUGINS_JSON.
//
// ApplyProgram is the legacy direct-plugin path the ttsc driver runs for plan
// entries listed in TTSC_LINKED_PLUGINS_JSON, distinct from the env-gated
// EmitTransform contributor the build/transform subcommands wire in. It mutates
// the parsed program's AST in place with NodeFlagsSynthesized nodes (through
// synthesized / injectOperationMetadataDecorator / injectOperationMetadataImport)
// rather than emitting JavaScript, and driver.Program.ApplyLinkedPlugins runs it
// exactly once. Driving it through LoadProgram + SourceFiles keeps the whole pass
// in-process so coverage attributes it to packages/sdk/native/sdk, where the
// `go run` subprocess in the reference build could not.
//
//  1. LoadProgram over the body fixture with TTSC_LINKED_PLUGINS_JSON naming the
//     SDK contributor.
//  2. Call ApplyLinkedPlugins so linkedPlugin.ApplyProgram mutates the AST.
//  3. Walk the controller's method modifiers and assert a synthesized
//     OperationMetadata decorator landed on a TypedRoute method, plus the
//     injected namespace import statement.
func TestSDKLinkedPluginApplyProgramInjectsDecorator(t *testing.T) {
	root := repoRoot(t)
	feature := "body"
	temp := writeFeatureTsconfig(t, root, feature, []string{
		"controllers/TypedBodyController.ts",
		"api/structures/IBbsArticle.ts",
	})
	// The ttsc driver reads TTSC_LINKED_PLUGINS_JSON to learn which registered
	// linked plugins to run; the SDK contributor's init registers exactly one, so
	// the single-entry plan maps to it positionally.
	t.Setenv(driver.LinkedPluginsEnv, sdkLinkedPluginsJSON)

	prog, diags, err := driver.LoadProgram(temp, "tsconfig.json", driver.LoadProgramOptions{})
	if err != nil {
		t.Fatalf("load program: %v", err)
	}
	if len(diags) > 0 {
		t.Fatalf("unexpected load diagnostics: %v", diags)
	}
	defer prog.Close()

	// SourceFiles triggers ApplyLinkedPlugins exactly once, which dispatches to
	// linkedPlugin.ApplyProgram and mutates every touched file in place.
	files := prog.SourceFiles()
	controller := findSourceFile(t, files, "TypedBodyController.ts")

	if !hasInjectedNamespaceImport(controller) {
		t.Fatalf("ApplyProgram did not inject the @nestia/sdk namespace import")
	}
	if !hasSynthesizedOperationMetadataDecorator(controller) {
		t.Fatalf("ApplyProgram did not inject a synthesized OperationMetadata decorator")
	}
}

func findSourceFile(t *testing.T, files []*shimast.SourceFile, base string) *shimast.SourceFile {
	t.Helper()
	for _, f := range files {
		if f == nil {
			continue
		}
		if filepath.Base(f.FileName()) == base {
			return f
		}
	}
	t.Fatalf("source file %q not found in program", base)
	return nil
}

// hasInjectedNamespaceImport reports whether the file's statement list carries an
// `import * as <ns> from "@nestia/sdk"` declaration — the import
// injectOperationMetadataImport prepends.
func hasInjectedNamespaceImport(file *shimast.SourceFile) bool {
	if file == nil || file.Statements == nil {
		return false
	}
	for _, stmt := range file.Statements.Nodes {
		if stmt == nil || stmt.Kind != shimast.KindImportDeclaration {
			continue
		}
		decl := stmt.AsImportDeclaration()
		if decl == nil || decl.ModuleSpecifier == nil {
			continue
		}
		if decl.ModuleSpecifier.Kind == shimast.KindStringLiteral && decl.ModuleSpecifier.Text() == "@nestia/sdk" {
			return true
		}
	}
	return false
}

// hasSynthesizedOperationMetadataDecorator walks every method declaration and
// reports whether any modifier is a synthesized OperationMetadata decorator —
// the node injectOperationMetadataDecorator prepends through the synthesized
// helper.
func hasSynthesizedOperationMetadataDecorator(file *shimast.SourceFile) bool {
	found := false
	var walk func(node *shimast.Node)
	walk = func(node *shimast.Node) {
		if node == nil || found {
			return
		}
		if node.Kind == shimast.KindMethodDeclaration {
			for _, dec := range node.Decorators() {
				if dec == nil || dec.Flags&shimast.NodeFlagsSynthesized == 0 {
					continue
				}
				if decoratorReferencesOperationMetadata(dec) {
					found = true
					return
				}
			}
		}
		node.ForEachChild(func(child *shimast.Node) bool {
			walk(child)
			return false
		})
	}
	walk(file.AsNode())
	return found
}

func decoratorReferencesOperationMetadata(dec *shimast.Node) bool {
	expr := dec.AsDecorator().Expression
	if expr == nil || expr.Kind != shimast.KindCallExpression {
		return false
	}
	callee := expr.AsCallExpression().Expression
	if callee == nil || callee.Kind != shimast.KindPropertyAccessExpression {
		return false
	}
	name := callee.AsPropertyAccessExpression().Name()
	return name != nil && name.Text() == "OperationMetadata"
}
