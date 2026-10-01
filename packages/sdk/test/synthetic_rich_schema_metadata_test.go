package test

import (
	"strings"
	"testing"
)

// Verifies the metadata JSON writer serializes the rich typia schema shapes —
// Set, Map, tuple, Date (escaped), and a template-literal property — that none of
// the tests/test-sdk controllers return.
//
// nestiaSDKMetadataSchemaLiteral fans out to nestiaSDKMetadataSets,
// nestiaSDKMetadataMaps, nestiaSDKMetadataTupleTypes, nestiaSDKMetadataEscaped and
// nestiaSDKMetadataTemplates only when typia's MetadataFactory reflects those
// members; the fixtures exercise objects, arrays and atomics but never a Set, Map,
// tuple, Date or template literal, leaving those writer arms — and the matching
// nestiaSDKVisitMetadataSchema set/map/tuple/escaped branches — dark. A synthetic
// controller returning an object that carries one of each is the only in-process
// driver, run through the exported EmitTransform with no disk emit.
//
//  1. Author a controller returning an object with Set, Map, tuple, Date and a
//     template-literal property.
//  2. Run the SDK metadata pass over it in-process.
//  3. Assert each reflected schema kind appears in the metadata.
//
// @evidence contracts/testing.md#behavioral-verification Reflection must retain Set, Map, tuple, escaped Date and template schema categories rather than silently dropping those authored members.
// @evidence contracts/testing.md#independent-expectations The IRich fixture authors each distinct non-atomic category; Date uses its JSON string escape representation and the id property is a template literal.
// @evidence contracts/testing.md#distinguishing-cases This covers five category-presence positives; property-schema and absent-field cases own exact constraints and omission. Category substring assertions do not independently inspect every nested element.
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
	meta := buildSyntheticMetadata(t, controller)
	for _, expected := range []string{
		`"sets":[`,
		`"maps":[`,
		`"tuples":[`,
		// Date reflects as an escaped schema (original Date / returns string).
		`"escaped":{`,
		// The template-literal property reflects into the templates writer.
		`"templates":[`,
	} {
		if !strings.Contains(meta, expected) {
			t.Fatalf("rich-schema metadata is missing %q\n%s", expected, meta)
		}
	}
}
