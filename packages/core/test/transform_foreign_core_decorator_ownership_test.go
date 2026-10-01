package test

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestTransformForeignCoreDecoratorOwnership verifies foreign TypedBody calls
// retain their authored arguments while the real core body receives validation.
//
// Resolved package ownership is also the fallback gate for core's native
// decorator rewrite. Foreign namespace calls can share the public spelling
// without opting into nestia's generated validators.
//
//  1. Author four foreign workspace/nested package decorators and real core input.
//  2. Transform the controller through the registered native dispatcher once.
//  3. Require every foreign call to remain empty and real core to receive assert.
//
// @evidence contracts/testing.md#behavioral-verification The actual native rewrite must preserve all four ForeignN.TypedBody() calls and inject an assert validator into the adjacent real core.TypedBody call. Wrong ownership changes a foreign call's argument list and fails its exact source oracle.
// @evidence contracts/testing.md#independent-expectations Foreign manifests and explicitly empty authored calls establish that those decorators receive no nestia validator; the supported assert option establishes the real decorator's protocol independently of emitted output.
// @evidence contracts/testing.md#distinguishing-cases Both workspace lib/source and nested installed-looking lib/source layouts are negative controls in one transform, alongside a real core body positive control. The package detector unit additionally owns malformed, relocated, re-exported and unresolved declarations.
// @evidence contracts/testing.md#execution-ownership The canonical core Go runner discovers this matching Test and calls transform.Run in-process with an owned temporary project/output. No host binary, SDK generation or runtime server is launched; generated-helper and HTTP boundaries own validation runtime semantics.
func TestTransformForeignCoreDecoratorOwnership(t *testing.T) {
	root := t.TempDir()
	write := func(location, contents string) {
		t.Helper()
		file := filepath.Join(root, filepath.FromSlash(location))
		if err := os.MkdirAll(filepath.Dir(file), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(file, []byte(contents), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	locations := []string{
		"packages/core/lib/foreign",
		"packages/core/src/decorators/foreign",
		"node_modules/@nestia/core/lib/foreign",
		"node_modules/@nestia/core/src/decorators/foreign",
	}
	write("node_modules/@nestia/core/package.json", `{"name":"@nestia/core"}`)
	var imports, methods strings.Builder
	imports.WriteString("import core from '@nestia/core';\ninterface IValue { value: number; }\n")
	for index, location := range locations {
		write(location+"/package.json", `{"name":"foreign-decorators"}`)
		write(location+"/index.ts", `export declare function TypedBody(...args: unknown[]): ParameterDecorator;`)
		fmt.Fprintf(&imports, "import * as Foreign%d from %q;\n", index, "./"+location)
		fmt.Fprintf(&methods, "  @core.TypedRoute.Post()\n  public foreign%d(@Foreign%d.TypedBody() body: IValue): IValue { return body; }\n", index, index)
	}
	methods.WriteString("  @core.TypedRoute.Post()\n  public real(@core.TypedBody() body: IValue): IValue { return body; }\n")
	write("main.ts", imports.String()+"export class Controller {\n"+methods.String()+"}\n")
	project := map[string]any{
		"extends": filepath.ToSlash(filepath.Join(repoRootForCore(t), "tests/config/tsconfig.json")),
		"compilerOptions": map[string]any{
			"noUnusedLocals":     false,
			"noUnusedParameters": false,
			"paths":              map[string][]string{"@nestia/core": {filepath.ToSlash(filepath.Join(repoRootForCore(t), "packages/core/src"))}},
		},
		"files":   []string{"main.ts"},
		"include": []string{},
	}
	encoded, err := json.Marshal(project)
	if err != nil {
		t.Fatal(err)
	}
	write("tsconfig.json", string(encoded))
	out := filepath.Join(root, "out.ts")
	if code := transform.Run([]string{"transform", "--cwd", root, "--tsconfig", "tsconfig.json", "--file", filepath.Join(root, "main.ts"), "--out", out, "--plugins-json", coreNativePlugins("assert", "assert")}); code != 0 {
		t.Fatalf("native transform exited %d", code)
	}
	output := mustReadFile(t, out)
	mustDecorateAll(t, output, `@core\.TypedBody`, "assert")
	if calls := decoratorValidatorTypes(output, `@core\.TypedBody`); len(calls) != 1 {
		t.Fatalf("only the real core.TypedBody call may receive a validator, found %d:\n%s", len(calls), output)
	}
	for index := range locations {
		mustContainAll(t, output, fmt.Sprintf("@Foreign%d.TypedBody()", index))
	}
}
