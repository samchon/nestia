package test

import (
	"path/filepath"
	"strings"
	"testing"
)

// TestTransformValidationModeProtocols verifies all ten validation options
// select each request decorator's own argument protocol.
//
// Headers collapse equality/clone/prune to three families, queries collapse
// clone/prune, and path parameters request reports only for validate modes.
// Checking each call separately prevents another decorator from hiding a
// missing argument or an incorrectly shared routing decision.
//
//  1. Author one controller with body, headers, query and path decorators.
//  2. Transform that same language input with each literal validation mode.
//  3. Check each discriminator and the path caster's report flag independently.
//
// @evidence contracts/testing.md#behavioral-verification The actual in-process source operation must inject the independently expected body, header and query discriminator for every option, and exactly one path caster whose third report flag matches the literal row. Absent or wrong arguments fail at their owning decorator.
// @evidence contracts/testing.md#independent-expectations Literal rows state the public ten-mode contracts: equality uses its base protocol, clone/prune use assert or validate, headers use their decoding family, and validate-prefixed modes request parameter reports. Expectations are not computed from emitted source or the production switch.
// @evidence contracts/testing.md#distinguishing-cases All ten modes share one authored input so each option change has an otherwise identical control. The existing body variant units distinguish equality, clone and prune helper emission; test_api_body_validator_variants owns actual installed helper mutation and malformed-value semantics. This unit does not claim ten installed wrapper programs.
// @evidence contracts/testing.md#execution-ownership The core Go test runner discovers this matching Test and invokes the owning source operation in-process. Temporary declarations and controller files are language inputs; the case installs no consumer, builds no executable and starts no Node process or application.
func TestTransformValidationModeProtocols(t *testing.T) {
	root := t.TempDir()
	writeCoreDeclarationPackage(t, root, `export declare function TypedBody(): ParameterDecorator;
export declare function TypedHeaders(): ParameterDecorator;
export declare function TypedQuery(): ParameterDecorator;
export declare function TypedParam(name: string): ParameterDecorator;
export declare namespace TypedRoute { function Post(path?: string): MethodDecorator; }`)
	writeFile(t, filepath.Join(root, "main.ts"), `import * as core from "@nestia/core";
interface IArticle { title: string; count: number; }
interface ISearch { keyword?: string; }
interface IHeaders { title: string; count: number; }
export class Controller {
  @core.TypedRoute.Post(":id")
  public store(@core.TypedParam("id") id: string, @core.TypedQuery() query: ISearch, @core.TypedBody() input: IArticle): IArticle { return input; }
  @core.TypedRoute.Post("headers")
  public headers(@core.TypedHeaders() input: IHeaders): IHeaders { return input; }
}`)
	writeFile(t, filepath.Join(root, "tsconfig.json"), `{"compilerOptions":{"target":"ES2022","module":"commonjs","strict":true,"experimentalDecorators":true,"ignoreDeprecations":"6.0"},"files":["main.ts"]}`)
	rows := []struct {
		mode, body, headers, query string
		report                     bool
	}{
		{"assert", "assert", "assert", "assert", false},
		{"is", "is", "is", "is", false},
		{"validate", "validate", "validate", "validate", true},
		{"assertEquals", "assert", "assert", "assert", false},
		{"equals", "is", "is", "is", false},
		{"validateEquals", "validate", "validate", "validate", true},
		{"assertClone", "assert", "assert", "assert", false},
		{"validateClone", "validate", "validate", "validate", true},
		{"assertPrune", "assert", "assert", "assert", false},
		{"validatePrune", "validate", "validate", "validate", true},
	}
	for _, row := range rows {
		t.Run(row.mode, func(t *testing.T) {
			out, diagnostics, code := runCoreNative([]string{"transform", "--cwd", root, "--tsconfig", "tsconfig.json", "--file", "main.ts", "--plugins-json", coreNativePlugins(row.mode, "assert")})
			if code != 0 {
				t.Fatalf("source transform exited %d: %s", code, diagnostics)
			}
			mustDecorateAll(t, out, `@core\.TypedBody`, row.body)
			mustDecorateAll(t, out, `@core\.TypedHeaders`, row.headers)
			mustDecorateAll(t, out, `@core\.TypedQuery`, row.query)
			spans := decoratorSpans(out, `@core\.TypedParam`)
			if len(spans) != 1 || !strings.Contains(spans[0], `@core.TypedParam("id", (input: string)`) {
				t.Fatalf("expected one injected path caster: %s", out)
			}
			if strings.Contains(spans[0], `}, true)`) != row.report {
				t.Fatalf("path report flag disagrees with mode %s: %s", row.mode, spans[0])
			}
		})
	}
}
