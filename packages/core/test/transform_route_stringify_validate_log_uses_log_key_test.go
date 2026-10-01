package test

import (
	"strings"
	"testing"
)

// TestTransformRouteStringifyValidateLogUsesLogKey verifies the @TypedRoute
// response generator emits a `validate.log` stringifier — produced by the
// validate JSON programmer but tagged with the `validate.log` type key — when
// the core plugin runs with `stringify: "validate.log"`.
//
// The validate.log branch is the only one that uses
// nestiaCoreValidatorObjectWithKey: it generates the validate stringifier yet
// records `type: "validate.log"` so the runtime logs instead of throwing on a
// response mismatch. A regression would emit the plain validate type and change
// the failure behavior, and `validate.log` must be the type value, never a
// property name.
//
//  1. Transform the body controller with stringify "validate.log".
//  2. Read the emitted --out source.
//  3. Assert the log type tag appears and is not used as a property key.
//
// @evidence contracts/testing.md#behavioral-verification validate.log must appear as the response discriminator and must not be emitted as an invalid dotted property name.
// @evidence contracts/testing.md#independent-expectations The serializer protocol stores validate.log as a string type discriminator; a dotted property would be invalid TypeScript rather than the configured logging mode.
// @evidence contracts/testing.md#distinguishing-cases The positive discriminator and forbidden dotted-property negative distinguish representation; the runtime option batch and validate-log HTTP feature own helper execution and logging.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformRouteStringifyValidateLogUsesLogKey(t *testing.T) {
	out := transformFileToString(t, "body", "TypedBodyController.ts", "validate", "validate.log")
	mustContainAll(t, out, "@core.TypedRoute.Post({", `type: "validate.log"`)
	if strings.Contains(out, "validate.log: ") {
		t.Fatalf("validate.log must be the stringifier type, not a property name\n%s", out)
	}
}
