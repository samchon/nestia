package test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
)

// TestTransformDirectCoreImportDeclaringPackage verifies a directly imported
// decorator is selected by its resolved declaration owner.
//
// TypeScript paths can map the same module specifier to unrelated declarations.
// Import text alone must not inject arguments into a foreign callable.
//
//  1. Author identical TypedBody signatures under core and foreign manifests.
//  2. Map @nestia/core to each declaration and transform four import forms.
//  3. Require injection for core and the exact empty call for foreign ownership.
//
// @evidence contracts/testing.md#behavioral-verification The native source rewrite injects assert validators into actual core-owned calls and preserves foreign-owned empty calls under named, renamed, default and namespace import bindings to @nestia/core.
// @evidence contracts/testing.md#independent-expectations Handwritten package manifests establish resolved declaration ownership. Identical authored signatures and import text do not transfer ownership; only the supported core decorator receives generated validation.
// @evidence contracts/testing.md#distinguishing-cases Core-owned positives and foreign-owned negatives share the DTO, declaration shape and exact module spelling for four import forms, including re-export facades whose package owner differs from the resolved declaration owner; relative namespace and nested-package controls remain in the existing provenance cases.
// @evidence contracts/testing.md#execution-ownership Go discovers this matching core unit Test and invokes the source-to-source operation in-process on temporary declarations and DTOs. No consumer, product JavaScript compilation, installed host or runtime process is prepared.
func TestTransformDirectCoreImportDeclaringPackage(t *testing.T) {
	for _, item := range []struct{ owner, facade string }{
		{"@nestia/core", ""},
		{"foreign-decorators", ""},
		{"@nestia/core", "foreign-facade"},
		{"foreign-decorators", "@nestia/core"},
	} {
		t.Run(item.owner+"-via-"+item.facade, func(t *testing.T) {
			root := t.TempDir()
			declarations := filepath.Join(root, "declarations")
			if err := os.MkdirAll(declarations, 0o755); err != nil {
				t.Fatal(err)
			}
			writeFile(t, filepath.Join(declarations, "package.json"), `{"name":"`+item.owner+`"}`)
			writeFile(t, filepath.Join(declarations, "index.d.ts"), `export declare function TypedBody(): ParameterDecorator;
declare const core: { TypedBody: typeof TypedBody };
export default core;`)
			entry := filepath.Join(declarations, "index.d.ts")
			if item.facade != "" {
				facade := filepath.Join(root, "facade")
				if err := os.MkdirAll(facade, 0o755); err != nil {
					t.Fatal(err)
				}
				writeFile(t, filepath.Join(facade, "package.json"), `{"name":"`+item.facade+`"}`)
				entry = filepath.Join(facade, "index.d.ts")
				writeFile(t, entry, `export { TypedBody, default } from "../declarations";`)
			}
			writeFile(t, filepath.Join(root, "main.ts"), `import Default, { TypedBody, TypedBody as Body } from "@nestia/core";
import * as Namespace from "@nestia/core";
interface IValue { value: number; }
export class Controller {
  public renamed(@Body() value: IValue): void {}
  public named(@TypedBody() value: IValue): void {}
  public defaultImport(@Default.TypedBody() value: IValue): void {}
  public namespaceImport(@Namespace.TypedBody() value: IValue): void {}
}`)
			config, err := json.Marshal(map[string]any{
				"compilerOptions": map[string]any{
					"target": "ES2022", "module": "commonjs", "strict": true, "experimentalDecorators": true, "ignoreDeprecations": "6.0",
					"paths": map[string][]string{"@nestia/core": {filepath.ToSlash(entry)}},
				},
				"files": []string{"main.ts"},
			})
			if err != nil {
				t.Fatal(err)
			}
			writeFile(t, filepath.Join(root, "tsconfig.json"), string(config))
			stdout, stderr, code := runCoreNative([]string{"transform", "--cwd", root, "--tsconfig", "tsconfig.json", "--file", "main.ts", "--plugins-json", coreNativePlugins("assert", "assert")})
			if code != 0 {
				t.Fatalf("source transform exited %d: %s", code, stderr)
			}
			for _, call := range []string{"@Body", "@TypedBody", "@Default.TypedBody", "@Namespace.TypedBody"} {
				if item.owner == "@nestia/core" {
					mustDecorateAll(t, stdout, regexp.QuoteMeta(call), "assert")
				} else if !strings.Contains(stdout, call+"()") || strings.Contains(stdout, `type: "assert"`) {
					t.Fatalf("foreign direct import received validator arguments: %s", stdout)
				}
			}
		})
	}
}
