package test

import "testing"

// TestTransformBodyAssertUsesAssertValidator verifies the @TypedBody generator
// emits a typia `assert` validator object when the core plugin runs with
// `validate: "assert"`.
//
// nestiaCoreGenerateTypedBody switches on the validate mode to pick the typia
// programmer; the assert branch records `type: "assert"`. A regression in the
// switch would fall through to the validate default and change the runtime
// validator shape silently while still compiling.
//
//  1. Transform the body feature's TypedBodyController with validate "assert".
//  2. Drive the assert / assert plugin in-process and read the --out file.
//  3. Assert the emitted validator metadata records the assert type.
func TestTransformBodyAssertUsesAssertValidator(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "assert", "assert")
	mustContainAll(t, out, "@core.TypedBody({", `type: "assert"`)
}
