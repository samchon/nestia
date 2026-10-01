package test

import (
	"path/filepath"
	"testing"
)

// TestTransformOptionFamilyRoutingMatrix verifies every global validate mode's
// header/query protocol and parameter report flag through the source operation.
//
// The old runtime probe checked these three arguments for all ten modes. The
// existing units covered only representative families, leaving clone, prune
// and equality option routing without their own complete literal oracle rows.
//
//  1. Author one genuine core declaration package and a three-input controller.
//  2. Transform that same source under all ten public validate options.
//  3. Compare each decorator's own discriminator, caster and report flag.
//
// @evidence contracts/testing.md#behavioral-verification All ten actual source-transform configurations must inject the authored header/query family's discriminator and one path caster with exactly the expected validate-report flag. A missing or misrouted call cannot pass through another decorator's discriminator.
// @evidence contracts/testing.md#independent-expectations Ten literal mode/family/flag rows preserve the old verifyOptions oracle: is/equals use is, validate variants use validate and all other modes use assert; only the four validate variants request path reports. Expectations are not obtained from transformed output or generator predicates.
// @evidence contracts/testing.md#distinguishing-cases Equality, clone and prune variants keep explicit positive rows alongside the base modes. Each mode checks all three independent decorators, and false flag rows reject an accidentally unconditional report flag; actual installed helper execution remains in the shared rich runtime cases.
// @evidence contracts/testing.md#execution-ownership Go discovers this one Test and invokes the actual source-to-source operation in-process. Temporary declarations and checker/AST preparation are test-language inputs; no product JavaScript build, native artifact, Node consumer, installation or server is prepared.
func TestTransformOptionFamilyRoutingMatrix(t *testing.T) {
	root := t.TempDir()
	writeCoreDeclarationPackage(t, root, `export declare function TypedHeaders(): ParameterDecorator;
export declare function TypedQuery(): ParameterDecorator;
export declare function TypedParam(name: string): ParameterDecorator;
declare const core: { TypedHeaders: typeof TypedHeaders; TypedQuery: typeof TypedQuery; TypedParam: typeof TypedParam };
export default core;`)
	writeFile(t, filepath.Join(root, "main.ts"), `import core from "@nestia/core";
interface IHeaders { title: string; count: number; }
interface ISearch { keyword?: string; }
export class Controller {
  public route(@core.TypedHeaders() headers: IHeaders, @core.TypedQuery() query: ISearch, @core.TypedParam("id") id: string): void {}
}`)
	writeFile(t, filepath.Join(root, "tsconfig.json"), `{"compilerOptions":{"target":"ES2022","module":"commonjs","strict":true,"experimentalDecorators":true,"ignoreDeprecations":"6.0"},"files":["main.ts"]}`)
	for _, item := range []struct {
		mode, family string
		flag         bool
	}{
		{"assert", "assert", false},
		{"is", "is", false},
		{"validate", "validate", true},
		{"assertEquals", "assert", false},
		{"equals", "is", false},
		{"validateEquals", "validate", true},
		{"assertClone", "assert", false},
		{"validateClone", "validate", true},
		{"assertPrune", "assert", false},
		{"validatePrune", "validate", true},
	} {
		t.Run(item.mode, func(t *testing.T) {
			out, diagnostics, code := runCoreNative([]string{"transform", "--cwd", root, "--tsconfig", "tsconfig.json", "--file", "main.ts", "--plugins-json", coreNativePlugins(item.mode, "assert")})
			if code != 0 {
				t.Fatalf("source transform exited %d: %s", code, diagnostics)
			}
			for _, pattern := range []string{`@core\.TypedHeaders`, `@core\.TypedQuery`} {
				if spans := decoratorSpans(out, pattern); len(spans) != 1 {
					t.Fatalf("%s has %d calls, want exactly one", pattern, len(spans))
				}
				mustDecorateAll(t, out, pattern, item.family)
			}
			calls, casters, flags := typedParamCounts(out)
			wantFlags := 0
			if item.flag {
				wantFlags = 1
			}
			if calls != 1 || casters != 1 || flags != wantFlags {
				t.Fatalf("parameter calls/casters/flags = %d/%d/%d, want 1/1/%d", calls, casters, flags, wantFlags)
			}
		})
	}
}
