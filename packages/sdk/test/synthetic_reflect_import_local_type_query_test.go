package test

import (
	"strings"
	"testing"
)

// Verifies local exported typeof bindings retain their declaration imports.
//
// A typeof annotation references a value binding, including a qualified
// namespace value. Generated clients need that binding in their type scope.
//
//  1. Analyze exported local and namespace values beside library typeof Math.PI.
//  2. Require their declaration imports and no import for the library value.
//
// @evidence contracts/testing.md#behavioral-verification EmitTransform must retain sample and Samples imports for their typeof response annotations, while typeof Math.PI contributes no library import.
// @evidence contracts/testing.md#independent-expectations TypeScript typeof sample and typeof Samples.sample require the exported value or namespace binding to be in scope. Math is provided by the actual standard library and requires no module import.
// @evidence contracts/testing.md#distinguishing-cases Local identifier and qualified namespace value references contrast a qualified actual-library value; exact reflected names, singleton declarations and an empty import collection detect lost bindings and library overcollection. Imported and re-exported typeof bindings belong to the reference-role case.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this direct EmitTransform Test, which loads and closes one authored checker program without compiling a product, installing a consumer or starting a host.
func TestSyntheticReflectImportLocalTypeQuery(t *testing.T) {
	const controller = `import core from "@nestia/core";
export const sample = { value: "text" };
export namespace Samples { export const sample = { value: "text" }; }
export class SyntheticController {
  @core.TypedRoute.Get("local")
  public local(): typeof sample { return sample; }
  @core.TypedRoute.Get("namespace")
  public namespaceValue(): typeof Samples.sample { return Samples.sample; }
  @core.TypedRoute.Get("library")
  public library(): typeof Math.PI { return Math.PI; }
}
`
	literals := strings.Split(buildSyntheticMetadata(t, controller), "\n")
	if len(literals) != 3 {
		t.Fatalf("expected three operations, got %d", len(literals))
	}
	for index, name := range []string{"typeof sample", "typeof Samples.sample", "typeof Math.PI"} {
		success := syntheticField(t, decodeSyntheticMetadata(t, literals[index]), "success")
		if actual := canonicalJSON(t, syntheticField(t, success, "type")); actual != `{"name":"`+name+`"}` {
			t.Errorf("operation %d typeof tree = %s, want %s", index, actual, name)
		}
	}
	for index, binding := range []string{"sample", "Samples"} {
		success := syntheticField(t, decodeSyntheticMetadata(t, literals[index]), "success")
		imports := syntheticField(t, success, "imports").([]any)
		if len(imports) != 1 || canonicalJSON(t, syntheticField(t, imports[0], "elements")) != `["`+binding+`"]` {
			t.Errorf("operation %d typeof imports = %v, want exactly %s", index, imports, binding)
		}
	}
	library := syntheticField(t, decodeSyntheticMetadata(t, literals[2]), "success")
	if actual := canonicalJSON(t, syntheticField(t, library, "imports")); actual != `[]` {
		t.Fatalf("library typeof imports = %s, want empty", actual)
	}
}
