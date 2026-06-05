package test

import "testing"

// TestTransformBodyAssertEqualsUsesAssertValidator verifies the @TypedBody
// generator routes `validate: "assertEquals"` through AssertProgrammer with
// Equals:true, recording `type: "assert"`.
//
// assertEquals is the throwing counterpart of equals: it both rejects excess
// properties and throws on mismatch. It shares the assert runtime tag with
// plain assert, so only the Equals flag distinguishes them; a regression in the
// assertEquals arm would drop the excess-property rejection.
//
//  1. Transform the body controller with validate "assertEquals".
//  2. Read the emitted --out source.
//  3. Assert the validator metadata records the assert type.
func TestTransformBodyAssertEqualsUsesAssertValidator(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "assertEquals", "assert")
	mustContainAll(t, out, "@core.TypedBody({", `type: "assert"`)
}
