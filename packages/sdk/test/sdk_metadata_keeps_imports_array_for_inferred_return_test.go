package test

import (
	"strings"
	"testing"
)

// Verifies anonymous inferred returns keep the required empty import collection.
//
// A named annotation adds a declaration import even when its object shape is
// identical to an inferred return, so the paired input prevents empty-all output.
//
//  1. Analyze inferred and explicitly named versions of the same object shape.
//  2. Require empty inferred imports and exactly the named declaration import.
//
// @evidence contracts/testing.md#behavioral-verification SDK analysis of an inferred-return controller must publish success.imports as an empty array rather than omitting it.
// @evidence contracts/testing.md#independent-expectations IOperationMetadata requires an imports array even when an anonymous inferred return has no named import; empty is a valid collection, not missing data.
// @evidence contracts/testing.md#distinguishing-cases The inferred return owns the zero-import boundary, while its explicitly named twin owns exactly one declaration import; synthetic inferred-return cases own reflected properties.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSDKMetadataKeepsImportsArrayForInferredReturn(t *testing.T) {
	const controller = `import core from "@nestia/core";
export interface IExplicit { value: number; }
export class SyntheticController {
  @core.TypedRoute.Get("inferred")
  public inferred() { return { value: 1 }; }
  @core.TypedRoute.Get("explicit")
  public explicit(): IExplicit { return { value: 1 }; }
}
`
	literals := strings.Split(buildSyntheticMetadata(t, controller), "\n")
	if len(literals) != 2 {
		t.Fatalf("expected two operations, got %d", len(literals))
	}
	inferred := syntheticField(t, decodeSyntheticMetadata(t, literals[0]), "success")
	if actual := canonicalJSON(t, syntheticField(t, inferred, "imports")); actual != `[]` {
		t.Fatalf("inferred imports = %s, want empty array", actual)
	}
	explicit := syntheticField(t, decodeSyntheticMetadata(t, literals[1]), "success")
	imports := syntheticField(t, explicit, "imports").([]any)
	if len(imports) != 1 || canonicalJSON(t, syntheticField(t, imports[0], "elements")) != `["IExplicit"]` {
		t.Fatalf("explicit named return must import its declaration, got %v", imports)
	}
}
