package test

import "testing"

// TestTransformParamAssertGeneratesCaster verifies the @TypedParam generator
// injects a typia caster under the non-validate `assert` mode.
//
// The injected caster distinguishes a transformed parameter from its original
// empty decorator call. The option runtime batch separately inspects decorator
// arguments; this emitted-source case asserts caster presence only.
//
//  1. Transform the param feature's TypedParamController with validate "assert".
//  2. Read the emitted --out source.
//  3. Assert the TypedParam decorator survived with an injected caster argument.
//
// @evidence contracts/testing.md#behavioral-verification The assert-mode parameter transform must retain TypedParam and inject a string-input caster, detecting an untouched decorator or absent caster.
// @evidence contracts/testing.md#independent-expectations Path parameters arrive as strings and TypedParam requires a generated caster. Its string-input signature follows the HTTP parameter contract.
// @evidence contracts/testing.md#distinguishing-cases This asserts caster presence; it does not currently assert the absence of the validate flag despite the historical filename. The validate counterpart pins flag presence and the option runtime batch owns mode argument checks.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformParamAssertGeneratesCaster(t *testing.T) {
	out := transformFileToString(t, "param", "TypedParamController.ts", "assert", "assert")
	calls, casters, flagged := typedParamCounts(out)
	if calls == 0 || casters != calls {
		t.Fatalf("assert-mode TypedParam carried %d casters for %d calls:\n%s", casters, calls, out)
	}
	if flagged != 0 {
		t.Fatalf("assert-mode TypedParam appended the validate-report flag %d times:\n%s", flagged, out)
	}
}
