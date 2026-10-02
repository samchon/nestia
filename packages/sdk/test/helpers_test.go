package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimprinter "github.com/microsoft/typescript-go/shim/printer"
	"github.com/samchon/ttsc/packages/ttsc/driver"

	// Import the SDK contributor so its init() registers the linked plugin
	// and the build/transform/source-rewrite/emit collectors with the shared
	// @nestia/core transform host. The tests exercise exported EmitTransform and
	// the driver's linked plugin dispatch in-process. Import initialization
	// installs those entry points before either operation is called.
	nativesdk "github.com/samchon/nestia/packages/sdk/native/sdk"
)

// coreOnlyPlugins drops the @nestia/sdk plugin entry, so the SDK contributor
// only runs when NESTIA_SDK_TRANSFORM activates it from the runtime env — the
// shape the nestia CLI emits, where the SDK is a statically linked core
// contributor rather than a top-level plugin.
const coreOnlyPlugins = `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}}]`

// writeFeatureTsconfig writes a tsconfig over owned authored native input
// and pins @nestia/core, @nestia/sdk, @api and @types/node to the repository
// declarations. No E2E runner or fixture installation is needed. Returns the temp
// dir holding the tsconfig.
func writeFeatureTsconfig(t *testing.T, root, feature string, files []string) string {
	t.Helper()
	temp := t.TempDir()
	featureRoot := filepath.Join(root, "packages/sdk/test/fixtures", feature)
	sourceRoot := filepath.Join(featureRoot, "src")
	typeRoots := nodeTypeRoots(t, root)

	abs := make([]string, len(files))
	for i, f := range files {
		abs[i] = `"` + filepath.ToSlash(filepath.Join(sourceRoot, f)) + `"`
	}
	body := `{
  "extends": "` + filepath.ToSlash(filepath.Join(featureRoot, "tsconfig.json")) + `",
  "compilerOptions": {
    "rootDir": "` + filepath.ToSlash(root) + `",
    "types": ["node"],
    "typeRoots": ["` + typeRoots + `"],
    "paths": {
      "@api": ["` + filepath.ToSlash(filepath.Join(sourceRoot, "api")) + `"],
      "@api/lib/*": ["` + filepath.ToSlash(filepath.Join(sourceRoot, "api/*")) + `"],
      "@nestia/core": ["` + filepath.ToSlash(filepath.Join(root, "packages/core/src")) + `"],
      "@nestia/core/*": ["` + filepath.ToSlash(filepath.Join(root, "packages/core/src/*")) + `"],
      "@nestia/sdk": ["` + filepath.ToSlash(filepath.Join(root, "packages/sdk/src")) + `"],
      "@nestia/sdk/*": ["` + filepath.ToSlash(filepath.Join(root, "packages/sdk/src/*")) + `"]
    }
  },
  "files": [` + strings.Join(abs, ",") + `],
  "include": []
}`
	tsconfig := filepath.Join(temp, "tsconfig.json")
	if err := os.WriteFile(tsconfig, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
	return temp
}

// loadFeatureProgram loads a *driver.Program over owned source fixture input
// without ForceEmit/outDir, so nothing is ever written to disk. The caller then
// drives the SDK contributor's exported entry points in-process. The single
// SDK import in this file initializes contributor registration.
func loadFeatureProgram(t *testing.T, feature string, files []string) (root string, prog *driver.Program) {
	t.Helper()
	root = repoRoot(t)
	temp := writeFeatureTsconfig(t, root, feature, files)
	prog, diags, err := driver.LoadProgram(temp, "tsconfig.json", driver.LoadProgramOptions{})
	if err != nil {
		t.Fatalf("load program for feature %q: %v", feature, err)
	}
	if len(diags) > 0 {
		t.Fatalf("unexpected load diagnostics for feature %q: %v", feature, diags)
	}
	return root, prog
}

// collectEmittedMetadata runs the SDK contributor's exported EmitTransform over a
// loaded program entirely in-process: it invokes the returned per-file closure
// with a fresh EmitContext on every source file (mirroring how core's build
// wires it into EmitWithPluginTransformers) and returns the metadata JSON string
// of every injected `<gen>.OperationMetadata("<json>")` decorator.
//
// No disk emit happens. Because the program is freshly loaded (typia/core have
// not rebuilt the methods into synthetic copies), EmitContext.MostOriginal maps
// each method to itself, so injectOperationMetadataDecoratorEC lands the
// decorator — carrying the metadata JSON as a single string literal — directly on
// the real method node, which this helper reads back out of the AST.
func collectEmittedMetadata(t *testing.T, prog *driver.Program) []string {
	t.Helper()
	transform, diags := nativesdk.EmitTransform(prog)
	if len(diags) > 0 {
		messages := make([]string, len(diags))
		for i, d := range diags {
			messages[i] = d.String("")
		}
		t.Fatalf("EmitTransform diagnostics:\n%s", strings.Join(messages, "\n"))
	}
	if transform == nil {
		t.Fatal("EmitTransform returned a nil transform; expected at least one SDK site")
	}
	ec := shimprinter.NewEmitContext()
	var out []string
	for _, sf := range prog.SourceFiles() {
		if sf == nil {
			continue
		}
		transform(ec, sf)
		out = append(out, operationMetadataLiterals(sf)...)
	}
	if len(out) == 0 {
		t.Fatal("no OperationMetadata decorator was injected by EmitTransform")
	}
	return out
}

// operationMetadataLiterals walks a transformed file and returns the string
// literal argument of every injected OperationMetadata decorator — the raw
// metadata JSON the SDK / Swagger / e2e generators read.
func operationMetadataLiterals(file *shimast.SourceFile) []string {
	var out []string
	var walk func(n *shimast.Node)
	walk = func(n *shimast.Node) {
		if n == nil {
			return
		}
		if n.Kind == shimast.KindMethodDeclaration {
			for _, dec := range n.Decorators() {
				if literal := operationMetadataDecoratorLiteral(dec); literal != "" {
					out = append(out, literal)
				}
			}
		}
		n.ForEachChild(func(c *shimast.Node) bool { walk(c); return false })
	}
	walk(file.AsNode())
	return out
}

// operationMetadataDecoratorLiteral returns the JSON string literal carried by a
// `<ns>.OperationMetadata("<json>")` decorator, or "" if dec is some other
// decorator.
func operationMetadataDecoratorLiteral(dec *shimast.Node) string {
	if dec == nil || dec.Kind != shimast.KindDecorator {
		return ""
	}
	expr := dec.AsDecorator().Expression
	if expr == nil || expr.Kind != shimast.KindCallExpression {
		return ""
	}
	call := expr.AsCallExpression()
	callee := call.Expression
	if callee == nil || callee.Kind != shimast.KindPropertyAccessExpression {
		return ""
	}
	name := callee.AsPropertyAccessExpression().Name()
	if name == nil || name.Text() != "OperationMetadata" {
		return ""
	}
	if call.Arguments == nil || len(call.Arguments.Nodes) != 1 {
		return ""
	}
	arg := call.Arguments.Nodes[0]
	if arg == nil || arg.Kind != shimast.KindStringLiteral {
		return ""
	}
	return arg.Text()
}

func repoRoot(t *testing.T) string {
	t.Helper()
	root, err := filepath.Abs("../../..")
	if err != nil {
		t.Fatal(err)
	}
	return root
}

func nodeTypeRoots(t *testing.T, root string) string {
	t.Helper()
	candidates := []string{
		filepath.Join(root, "node_modules/@types"),
	}
	matches, err := filepath.Glob(filepath.Join(root, "node_modules/.pnpm/@types+node@*/node_modules/@types"))
	if err != nil {
		t.Fatal(err)
	}
	candidates = append(candidates, matches...)
	for _, candidate := range candidates {
		if _, err := os.Stat(filepath.Join(candidate, "node")); err == nil {
			return filepath.ToSlash(candidate)
		}
	}
	t.Fatal("unable to locate @types/node")
	return ""
}
