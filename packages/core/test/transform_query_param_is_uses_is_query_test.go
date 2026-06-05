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
func TestTransformQueryParamIsUsesIsQuery(t *testing.T) {
	out := transformFileToString(t, "query", "QueryController.ts", "is", "assert")
	if !strings.Contains(out, `type: "is"`) {
		t.Fatalf("is-mode @TypedQuery() did not record is validator type:\n%s", out)
	}
}
