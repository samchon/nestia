package test

import (
	"strings"
	"testing"
)

// TestTransformParamAssertGeneratesCaster verifies the @TypedParam generator
// injects a typia caster under the non-validate `assert` mode, driving the
// nestiaCoreGenerateTypedParam path with the flag-append conditional NOT firing.
//
// The flag-append conditional only fires for modes that start with "validate";
// the assert run exercises the false side of `strings.HasPrefix(Validate,
// "validate")` in the parameter-argument assembler, which the validate-mode
// test cannot reach. The injected caster proves the parameter decorator was
// still rewritten.
//
//  1. Transform the param feature's TypedParamController with validate "assert".
//  2. Read the emitted --out source.
//  3. Assert the TypedParam decorator survived with an injected caster argument.
func TestTransformParamAssertGeneratesCaster(t *testing.T) {
	out := transformFileToString(t, "param", "TypedParamController.ts", "assert", "assert")
	if !strings.Contains(out, "@core.TypedParam(") {
		t.Fatalf("param transform dropped the TypedParam decorator:\n%s", out)
	}
	if !strings.Contains(out, "(input: string)") {
		t.Fatalf("assert-mode TypedParam did not inject a caster:\n%s", out)
	}
}
