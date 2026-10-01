package test

import (
	"strings"
	"testing"
)

// TestTransformQueryParamIsUsesIsQuery verifies the @TypedQuery() parameter
// generator selects the HttpIsQuery programmer (validator key "is") for is/equals
// modes, with the optional-property allowance the parameter form enables.
//
// nestiaCoreGenerateTypedQuery routes by validate mode just like its headers and
// form-data siblings; the is arm fires only for "is"/"equals" and is distinct
// from the TypedQueryRoute stringify switch the query-route tests drive. The
// QueryController's `@TypedQuery() query: IQuery` parameter takes the allowOptional
// branch, so this also pins that the parameter form keeps optional handling. A
// regression in the prefix routing would keep the assert query validator for
// is-mode parameters.
//
//  1. Transform QueryController with validate "is".
//  2. Read the emitted --out source.
//  3. Assert a query validator object records the is type.
//
// @evidence contracts/testing.md#behavioral-verification A native transform of the handwritten query parameter fixture with mode is must emit the is discriminator. This detects absent argument injection and wrong family selection, rather than inspecting committed source arrangement.
// @evidence contracts/testing.md#independent-expectations The supported is option selects the is runtime protocol for query parameter. The literal discriminator is derived from that option contract; this text assertion does not establish all helper internals or runtime semantics.
// @evidence contracts/testing.md#distinguishing-cases This owns is's emitted family; sibling modes distinguish assert, is and validate selection. The option runtime batch owns body clone, equality, prune and malformed-value semantics, and actual HTTP feature cases own transport. Whole-output matching alone cannot distinguish two same-family decorators.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformQueryParamIsUsesIsQuery(t *testing.T) {
	out := transformFileToString(t, "query", "QueryController.ts", "is", "assert")
	if !strings.Contains(out, `type: "is"`) {
		t.Fatalf("is-mode @TypedQuery() did not record is validator type:\n%s", out)
	}
}
