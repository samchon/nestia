package test

import (
	"sort"
	"strconv"
	"strings"
	"testing"
)

// Verifies the SDK bake omits the schema fields typia leaves absent instead of
// writing them as JSON null, and keeps the nulls that are real values.
//
// typia's schema writer stores a Go nil for an absent field: a constant with no
// `@title` or description gets nil `title` and `description`, and `any` gets a
// nil `type`. typia's own literal printer skips those, but the SDK metadata is
// serialized with encoding/json, which printed `"title": null` and
// `"type": null` into every generated Swagger document, and neither is valid
// JSON Schema. The walk has to reach every subschema, including array items,
// tuple members and record values. Two twins bound the fix: a documented
// constant must keep its real annotations, and a null in an instance keyword
// (`example`, `default`), inside instance data (`tags.Examples`), or in a
// vendor extension (`tags.JsonSchemaPlugin`) is a real value that typia also
// writes as a bare nil, so it must stay null. Only the SDK contributor runs
// in-process, so the query object can hold the tuple and record members core's
// HttpQuery validation would reject in a real build; the bake treats every
// parameter alike.
//
//  1. Author a controller whose query object and response carry undocumented
//     literal unions (alone, as array items, as tuple members, and as record
//     values), `any`, a documented enum, and declared null instance and
//     extension values.
//  2. Run the SDK metadata pass over it in-process.
//  3. Walk every baked schema, components and property schemas included, and
//     assert the only null members are the declared instance and extension
//     values.
//  4. Assert the documented enum member keeps its description.
func TestSyntheticJsonSchemaOmitsTypiaAbsentFields(t *testing.T) {
	const controller = `import core from "@nestia/core";
import { tags } from "typia";

enum Kind {
  /** First kind. */
  A = "a",
  B = "b",
}

interface IAbsent {
  literal: "x" | "y";
  anything: any;
  kind: Kind;
  plugin: string & tags.JsonSchemaPlugin<{ "x-empty": null }>;
  named: string & tags.Examples<{ none: null; some: "a" }>;
  instance: string & tags.JsonSchemaPlugin<{ example: null; default: null }>;
  items: Array<"p" | "q">;
  tuple: ["x", "y"];
  record: Record<string, "m" | "n">;
}

export class SyntheticController {
  @core.TypedRoute.Get("absent")
  public absent(@core.TypedQuery() query: IAbsent): IAbsent {
    return query;
  }
}
`
	metadata := decodeSyntheticMetadata(t, buildSyntheticMetadata(t, controller))
	parameter := syntheticField(t, metadata, "parameters").([]any)[0]
	success := syntheticField(t, metadata, "success")
	for _, target := range []struct {
		name     string
		response any
	}{
		{name: "parameter", response: parameter},
		{name: "success", response: success},
	} {
		for _, pipe := range []string{"primitive", "resolved"} {
			baked := syntheticJsonSchema(t, target.response, pipe)
			nulls := syntheticNullMembers(baked, "")
			sort.Strings(nulls)
			expected := []string{}
			prefixes := []string{".components.schemas.IAbsent.properties"}
			if _, decomposed := baked["properties"]; decomposed {
				prefixes = append(prefixes, ".properties")
			}
			for _, prefix := range prefixes {
				expected = append(
					expected,
					prefix+".instance.default",
					prefix+".instance.example",
					prefix+".named.examples.none",
					prefix+".plugin.x-empty",
				)
			}
			sort.Strings(expected)
			if strings.Join(nulls, ",") != strings.Join(expected, ",") {
				t.Fatalf("%s.%s null members are %v, expected %v", target.name, pipe, nulls, expected)
			}
		}
	}

	properties := syntheticJsonSchema(t, parameter, "resolved")["properties"].(map[string]any)
	if anything, _ := properties["anything"].(map[string]any); anything == nil || len(anything) != 0 {
		t.Fatalf("`any` property should bake an empty schema, got %v", properties["anything"])
	}
	kind, _ := properties["kind"].(map[string]any)
	members, _ := kind["oneOf"].([]any)
	if len(members) != 2 {
		t.Fatalf("enum property should bake two constants, got %v", properties["kind"])
	}
	first, _ := members[0].(map[string]any)
	second, _ := members[1].(map[string]any)
	if first["const"] != "a" || first["description"] != "First kind." {
		t.Fatalf("documented enum member lost its description: %v", first)
	}
	if _, exists := second["description"]; exists {
		t.Fatalf("undocumented enum member gained a description: %v", second)
	}
}

// syntheticNullMembers lists the paths of object members whose value is null.
// Array elements are not reported: typia prints a nil array element as null.
func syntheticNullMembers(input any, path string) []string {
	output := []string{}
	switch value := input.(type) {
	case map[string]any:
		for key, member := range value {
			if member == nil {
				output = append(output, path+"."+key)
				continue
			}
			output = append(output, syntheticNullMembers(member, path+"."+key)...)
		}
	case []any:
		for i, element := range value {
			output = append(output, syntheticNullMembers(element, path+"["+strconv.Itoa(i)+"]")...)
		}
	}
	return output
}
