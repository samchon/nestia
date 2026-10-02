package test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimcore "github.com/microsoft/typescript-go/shim/core"
	shimparser "github.com/microsoft/typescript-go/shim/parser"
	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestTransformComposedDecoratorOriginalProvenance verifies checker ownership
// and manual argument selection after typia rebuilds decorator expressions.
//
// Generic decorator signatures require their original checker context even when
// typia has replaced an argument. The emitted call must retain that replacement,
// while ownership and serializer classification use the declaration's context.
//
//  1. Author the same generic decorator ABI under core and foreign manifests.
//  2. Compose typia factory rewriting with the core source-transform operation.
//  3. Parse output to verify manual argument preservation and owner-only injection.
//
// @evidence contracts/testing.md#behavioral-verification The actual composed source transform lowers parameter and serializer factories without panicking, preserves manual argument counts and report flags, and injects automatic validators only into core-owned declarations.
// @evidence contracts/testing.md#independent-expectations Authored manifests establish declaration ownership independently of imported spelling. The public TypedParam three-argument ABI and TypedRoute serializer descriptor ABI establish literal argument counts; typia factories must become callable generated implementations.
// @evidence contracts/testing.md#distinguishing-cases Generic three-argument false/true parameter siblings, sole serializer expression, path-plus-serializer expression and automatic decorators in a rewritten method distinguish original checker queries from current emitted nodes. Every specimen has a foreign-owner negative twin with otherwise identical declarations and source.
// @evidence contracts/testing.md#execution-ownership The canonical core Go population discovers this single Test. Existing RunWithOutput executes typia and core in-process on temporary authored sources, and the existing parser examines output without a second compiler, native artifact, installation, Node process or HTTP host.
func TestTransformComposedDecoratorOriginalProvenance(t *testing.T) {
	t.Setenv("NESTIA_NATIVE_DEBUG_STACK", "1")
	declaration := `interface ISerializer<T> { type: "assert"; assert: (input: T) => string; }
export declare function TypedParam<T extends boolean | bigint | number | string | null>(name: string, assert?: (value: string) => T, validate?: boolean): ParameterDecorator;
export declare function TypedBody(): ParameterDecorator;
export declare namespace TypedRoute {
  function Get<T>(pathOrSerializer?: string | ISerializer<T>, serializer?: ISerializer<T>): MethodDecorator;
}
`
	for _, specimen := range []struct {
		name, methods string
		counts        map[string]int
	}{
		{"parameter", `public flat(@core.TypedParam("value", typia.http.createParameter<number>(), false) value: number): number { return value; }
public structured(@core.TypedParam("value", typia.http.createParameter<number>(), true) value: number): number { return value; }`, map[string]int{"TypedParam": 3}},
		{"sole-serializer", `@core.TypedRoute.Get(serializer(typia.json.createAssertStringify<IValue>()))
public sole(): IValue { return { value: 1 }; }`, map[string]int{"TypedRoute.Get": 1}},
		{"path-serializer", `@core.TypedRoute.Get("manual", serializer(typia.json.createAssertStringify<IValue>()))
public path(): IValue { return { value: 1 }; }`, map[string]int{"TypedRoute.Get": 2}},
		{"automatic", `@core.TypedRoute.Get("automatic")
public automatic(@core.TypedBody() input: IValue): IValue { return typia.random<IValue>(); }`, map[string]int{"TypedRoute.Get": 1, "TypedBody": 0}},
	} {
		for _, owner := range []string{"@nestia/core", "foreign-decorators"} {
			t.Run(specimen.name+"/"+owner, func(t *testing.T) {
				root := t.TempDir()
				declarations := filepath.Join(root, "declarations")
				if err := os.MkdirAll(declarations, 0o755); err != nil {
					t.Fatal(err)
				}
				writeFile(t, filepath.Join(declarations, "package.json"), `{"name":"`+owner+`"}`)
				writeFile(t, filepath.Join(declarations, "index.d.ts"), declaration)
				writeFile(t, filepath.Join(root, "main.ts"), `import * as core from "@nestia/core";
import typia from "typia";
interface IValue { value: number; }
function serializer(assert: (input: unknown) => string): { type: "assert"; assert: (input: unknown) => string } { return { type: "assert", assert }; }
export class Controller {
`+specimen.methods+`
}`)
				config, err := json.Marshal(map[string]any{
					"compilerOptions": map[string]any{
						"target": "ES2022", "module": "commonjs", "moduleResolution": "node", "strict": true,
						"experimentalDecorators": true, "esModuleInterop": true, "skipLibCheck": true, "ignoreDeprecations": "6.0",
						"paths": map[string][]string{
							"@nestia/core": {filepath.ToSlash(filepath.Join(declarations, "index.d.ts"))},
							"typia":        {filepath.ToSlash(filepath.Join(repoRootForCore(t), "packages/core/node_modules/typia/lib/index.d.ts"))},
						},
					},
					"files": []string{"main.ts"},
				})
				if err != nil {
					t.Fatal(err)
				}
				writeFile(t, filepath.Join(root, "tsconfig.json"), string(config))
				out, stderr, code := runCoreNative([]string{"transform", "--cwd", root, "--tsconfig", "tsconfig.json", "--file", "main.ts", "--plugins-json", coreNativePlugins("assert", "assert")})
				if code != 0 {
					t.Fatalf("composed source transform exited %d: %s", code, stderr)
				}
				parsed := shimparser.ParseSourceFile(shimast.SourceFileParseOptions{FileName: filepath.ToSlash(filepath.Join(root, "emitted.ts"))}, out, shimcore.ScriptKindTS)
				seen, arrows, factories, reports := map[string]int{}, 0, 0, map[shimast.Kind]int{}
				var visit func(*shimast.Node)
				visit = func(node *shimast.Node) {
					if node.Kind == shimast.KindArrowFunction {
						arrows++
					}
					if node.Kind == shimast.KindCallExpression {
						call := node.AsCallExpression()
						name := strings.Join(transform.NestiaCoreExpressionSegments(call.Expression), ".")
						if name == "typia.http.createParameter" || name == "typia.json.createAssertStringify" || name == "typia.random" {
							factories++
						}
						if strings.HasPrefix(name, "core.") {
							key := strings.TrimPrefix(name, "core.")
							want, ok := specimen.counts[key]
							if !ok {
								t.Fatalf("unexpected decorator call %s", name)
							}
							if specimen.name == "automatic" && owner == "@nestia/core" {
								want++
							}
							count := 0
							if call.Arguments != nil {
								count = len(call.Arguments.Nodes)
							}
							if count != want {
								t.Fatalf("%s has %d arguments, want %d\n%s", name, count, want, out)
							}
							seen[key]++
							if key == "TypedParam" {
								reports[call.Arguments.Nodes[2].Kind]++
							}
						}
					}
					node.ForEachChild(func(child *shimast.Node) bool { visit(child); return false })
				}
				visit(parsed.AsNode())
				for key := range specimen.counts {
					want := 1
					if key == "TypedParam" {
						want = 2
					}
					if seen[key] != want {
						t.Fatalf("%s count %d, want %d", key, seen[key], want)
					}
				}
				if specimen.name == "parameter" && (reports[shimast.KindTrueKeyword] != 1 || reports[shimast.KindFalseKeyword] != 1) {
					t.Fatalf("manual report flags changed: %v", reports)
				}
				if factories != 0 || arrows == 0 {
					t.Fatalf("typia factories not lowered: factory calls %d, generated arrows %d\n%s", factories, arrows, out)
				}
			})
		}
	}
}
