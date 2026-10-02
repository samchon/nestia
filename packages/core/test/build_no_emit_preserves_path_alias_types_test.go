package test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestBuildNoEmitPreservesPathAliasTypes verifies analysis-only builds retain
// source import identities when output paths differ from their source paths.
//
// The private emitting traversal of a noEmit project must resolve imported
// aliases from TypeScript sources, not from unpublished JavaScript. Relative
// and inline controls distinguish that failure from unsupported scalar types.
//
//  1. Author an inherited paths configuration and a cross-file UUID alias.
//  2. Exercise configured, explicit and check noEmit entries with adjacent controls.
//  3. Require scalar acceptance, object rejection and no published artifacts.
//  4. Require the emitting control to generate UUID validation and remap value imports.
//
// @evidence contracts/testing.md#behavioral-verification In-process build/check commands analyze imported tagged parameters, bodies, queries, headers and return values; all noEmit entries accept the scalar fixture without artifacts, reject an object path parameter, and the emit control produces UUID validation and a relative value import.
// @evidence contracts/testing.md#independent-expectations TypeScript paths names source modules even when output is suppressed. The authored UUID tag permits string scalars, while TypedParam forbids objects. noEmit forbids publication; a normal emitted value import must reach its emitted sibling.
// @evidence contracts/testing.md#distinguishing-cases Inherited configured noEmit, explicit --noEmit and check share path-alias, relative-import and inline controls; an object alias is the rejecting twin. Emitting compilation checks the separate output-remapping branch, and absent output and manifest checks distinguish analysis from publication.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and its named table subtests; runCoreNative invokes the owning build dispatcher in-process. Authored declarations and sources belong to t.TempDir, with no installed consumer, Node runtime, host or native-binary build.
func TestBuildNoEmitPreservesPathAliasTypes(t *testing.T) {
	for _, entry := range []string{"configured", "explicit", "check", "emit"} {
		for _, spelling := range []string{"paths", "relative", "inline", "object"} {
			t.Run(entry+"/"+spelling, func(t *testing.T) {
				root := t.TempDir()
				writeCoreDeclarationPackage(t, root, `
export declare function TypedParam(name: string): ParameterDecorator;
export declare function TypedBody(): ParameterDecorator;
export declare function TypedQuery(): ParameterDecorator;
export declare function TypedHeaders(): ParameterDecorator;
export declare namespace TypedRoute { function Get(path: string): MethodDecorator; }
`)
				src := filepath.Join(root, "src")
				if err := os.MkdirAll(src, 0o755); err != nil {
					t.Fatal(err)
				}
				writeFile(t, filepath.Join(src, "types.ts"), `import { tags } from "typia";
export type UuidString = string & tags.Format<"uuid">;
export type Invalid = { id: UuidString };
export const marker = "source-module";
`)
				module := "@/types"
				if spelling == "relative" {
					module = "./types"
				}
				parameter := "UuidString"
				if spelling == "inline" {
					parameter = `string & tags.Format<"uuid">`
				} else if spelling == "object" {
					parameter = "Invalid"
				}
				writeFile(t, filepath.Join(src, "main.ts"), `import { TypedParam, TypedBody, TypedQuery, TypedHeaders, TypedRoute } from "@nestia/core";
import { tags } from "typia";
import { marker } from "`+module+`";
import type { UuidString, Invalid } from "`+module+`";
export class Controller {
 @TypedRoute.Get(":id")
 public get(@TypedParam("id") id: `+parameter+`): `+parameter+` { return id; }
 @TypedRoute.Get("body")
 public body(@TypedBody() body: { id: UuidString }): { id: UuidString } { return body; }
 @TypedRoute.Get("query")
 public query(@TypedQuery() query: { id: UuidString }): { id: UuidString } { return query; }
 @TypedRoute.Get("headers")
 public headers(@TypedHeaders() headers: { id: UuidString }): { id: UuidString } { return headers; }
}
export const value = marker;
`)
				base, err := json.Marshal(map[string]any{
					"compilerOptions": map[string]any{
						"target": "ES2022", "module": "nodenext", "moduleResolution": "nodenext", "strict": true,
						"experimentalDecorators": true, "skipLibCheck": true, "ignoreDeprecations": "6.0",
						"rootDir": "src", "outDir": "dist", "declaration": true,
						"paths": map[string][]string{
							"@/*":   {"./src/*"},
							"typia": {filepath.ToSlash(filepath.Join(repoRootForCore(t), "packages/core/node_modules/typia/lib/index.d.ts"))},
						},
					},
				})
				if err != nil {
					t.Fatal(err)
				}
				writeFile(t, filepath.Join(root, "base.json"), string(base))
				config := `{"extends":"./base.json","compilerOptions":{"noEmit":` + map[bool]string{true: "true", false: "false"}[entry == "configured"] + `},"include":["src"]}`
				writeFile(t, filepath.Join(root, "tsconfig.json"), config)
				command := "build"
				if entry == "check" {
					command = "check"
				}
				manifest := filepath.Join(root, "manifest.json")
				args := []string{command, "--cwd", root, "--tsconfig", "tsconfig.json", "--manifest", manifest, "--plugins-json", coreNativePlugins("assert", "assert")}
				if entry == "explicit" {
					args = append(args, "--noEmit")
				}
				out, stderr, code := runCoreNative(args)
				if spelling == "object" {
					if code != 3 || !strings.Contains(stderr, "nestia.core.TypedParam") || !strings.Contains(stderr, "only atomic or constant types") || strings.Contains(stderr, "- any") {
						t.Fatalf("object parameter not rejected correctly: code=%d\n%s\n%s", code, out, stderr)
					}
				} else if code != 0 {
					t.Fatalf("valid alias failed: code=%d\n%s\n%s", code, out, stderr)
				}
				if entry != "emit" || spelling == "object" {
					for _, path := range []string{filepath.Join(root, "dist"), manifest} {
						if _, err := os.Stat(path); !os.IsNotExist(err) {
							t.Fatalf("unaccepted publication at %s: %v", path, err)
						}
					}
				} else {
					data, err := os.ReadFile(filepath.Join(root, "dist", "main.js"))
					if err != nil {
						t.Fatal(err)
					}
					importPath := `require("./types.js")`
					if spelling == "relative" {
						importPath = `require("./types")`
					}
					mustContainAll(t, string(data), `_isFormatUuid`, `TypedParam)("id",`, importPath)
				}
			})
		}
	}
}
