package test

import "testing"

// Verifies native metadata retains five distinct collection categories.
//
// Each authored property owns one of the inspected Set, Map, tuple, escaped
// Date and template families. Nested category contents are not asserted.
//
//  1. Author a controller returning an object with Set, Map, tuple, Date and a
//     template-literal property.
//  2. Run the SDK metadata pass over it in-process.
//  3. Assert each property carries exactly its own schema kind.
//
// @evidence contracts/testing.md#behavioral-verification Reflection must attach to each authored property exactly its own category among the inspected Set, Map, tuple, escaped Date and template families, rather than silently dropping a member or assigning it another category.
// @evidence contracts/testing.md#independent-expectations The IRich fixture authors each distinct non-atomic category; Date uses its JSON string escape representation and the id property is a template literal.
// @evidence contracts/testing.md#distinguishing-cases Five properties each own one of the five inspected categories and none of the other four, so a category written under the wrong property or shared by two is detected; property-schema and absent-field cases own exact constraints and omission. Nested elements of each category are not inspected.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test. Its authored TypeScript program is loaded and analyzed in-process by EmitTransform with a temporary project and a closed program, without building a native artifact or starting an installed host; CLI/runtime cohorts separately own consumer assembly.
func TestSyntheticRichSchemaMetadataSerializesSetMapTupleDateTemplate(t *testing.T) {
	const controller = `import core from "@nestia/core";

type Id = ` + "`id-${number}`" + `;

interface IRich {
  set: Set<string>;
  map: Map<string, number>;
  tuple: [number, string];
  when: Date;
  id: Id;
}

export class SyntheticController {
  @core.TypedRoute.Get("rich")
  public rich(): IRich {
    return null!;
  }
}
`
	metadata := decodeSyntheticMetadata(t, buildSyntheticMetadata(t, controller))
	data := syntheticField(t, syntheticField(t, syntheticField(t, metadata, "success"), "primitive"), "data")
	objects := syntheticField(t, syntheticField(t, data, "components"), "objects").([]any)
	if len(objects) != 1 {
		t.Fatalf("expected the IRich object alone, got %d objects", len(objects))
	}
	// Each property carries its own schema category: a Set, a Map, a tuple, a Date
	// as an escaped schema (original Date, returning a string) and a template.
	categories := map[string]string{}
	for _, property := range syntheticField(t, objects[0], "properties").([]any) {
		key := syntheticMetadataConstant(t, syntheticField(t, property, "key")).(string)
		value := syntheticField(t, property, "value").(map[string]any)
		for _, category := range []string{"sets", "maps", "tuples", "templates"} {
			if items, _ := value[category].([]any); len(items) != 0 {
				categories[key] += category + ","
			}
		}
		if value["escaped"] != nil {
			categories[key] += "escaped,"
		}
	}
	for key, expected := range map[string]string{
		"set":   "sets,",
		"map":   "maps,",
		"tuple": "tuples,",
		"when":  "escaped,",
		"id":    "templates,",
	} {
		if categories[key] != expected {
			t.Fatalf("property %q carries the schema categories %q, expected %q: %v", key, categories[key], expected, categories)
		}
	}
}
