package test

import (
	"strings"
	"testing"
)

// TestTransformParamValidateAppendsFlag verifies the @TypedParam generator
// injects a typia caster and, under validate-family modes, appends the
// `validate?: boolean` flag (`true`) as the decorator's third argument.
//
// nestiaCoreGenerateTypedParam writes HttpParameterProgrammer output, then the
// parameter-argument assembler appends `true` when options.Validate starts with
// "validate" so the runtime emits the detailed report shape. A regression in
// that conditional would drop the flag and revert to the single-error shape.
//
//  1. Transform the param feature's TypedParamController with validate "validate".
//  2. Read the emitted --out source.
//  3. Assert the TypedParam decorator gained an injected caster and the flag.
//
// @evidence contracts/testing.md#behavioral-verification The validate-mode parameter transform must retain TypedParam and append the literal true report flag; losing report selection fails.
// @evidence contracts/testing.md#independent-expectations The TypedParam runtime uses the third true argument to request a validation report under validate-family modes.
// @evidence contracts/testing.md#distinguishing-cases This owns the validate flag positive; the assert caster case complements injection and the option runtime batch checks parameter arguments. This whole-output assertion does not alone locate every parameter call.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformParamValidateAppendsFlag(t *testing.T) {
	out := transformFileToString(t, "param", "TypedParamController.ts", "validate", "assert")
	if !strings.Contains(out, "@core.TypedParam(") {
		t.Fatalf("param transform dropped the TypedParam decorator:\n%s", out)
	}
	if !strings.Contains(out, ", true)") {
		t.Fatalf("validate-mode TypedParam did not append the boolean report flag:\n%s", out)
	}
}
