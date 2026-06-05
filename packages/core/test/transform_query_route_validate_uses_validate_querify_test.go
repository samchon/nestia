package test

import "testing"

// TestTransformQueryRouteValidateUsesValidateQuerify verifies a
// @TypedQuery.Route with `stringify: "validate"` selects the validate-querify
// programmer (nestiaCoreHttpValidateQuerifyProgrammer), recording
// `type: "validate"`.
//
// The validate branch threads the validator output through the querify
// stringifier; it is the only query-route branch that calls the validate
// querify programmer. A regression would silently fall back to the assert
// querify and drop the validation report.
//
//  1. Transform QueryController with stringify "validate".
//  2. Read the emitted --out source.
//  3. Assert URLSearchParams is built and the metadata records validate.
func TestTransformQueryRouteValidateUsesValidateQuerify(t *testing.T) {
	out := transformFileToString(t, "query", "QueryController.ts", "validate", "validate")
	mustContainAll(t, out, "URLSearchParams", `type: "validate"`)
}
