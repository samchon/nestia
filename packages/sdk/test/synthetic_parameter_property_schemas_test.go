package test

import (
	"reflect"
	"testing"
)

// Verifies the SDK bake writes typia's schema of each property of a parameter's
// object type, only on the parameter's resolved schema.
//
// The Swagger generator decomposes a query or headers object into one OpenAPI
// parameter per property. Those parameters used to take their schemas from a
// JS fallback that read only the atomic kind, so every type tag, integer type,
// template-literal pattern and constant annotation disappeared, and a literal
// object became a `$ref` to a component typia never writes. The bake has to
// come from typia's own schema writer, keep the property's `x-` JSDoc
// extensions the way typia's object schema does, skip exactly the properties
// that schema omits, and stay off the schemas nothing decomposes.
//
//  1. Author a controller whose query object covers tagged atomics, an `x-`
//     JSDoc extension, an integer type, a template literal, a tagged array, a
//     literal object, a function-only member and `@internal` / `@hidden` /
//     `@ignore` members, and that returns the same object.
//  2. Run the SDK metadata pass over it in-process.
//  3. Assert the resolved parameter schema carries typia's value schemas for
//     the described properties and none for the omitted ones.
//  4. Assert neither the primitive parameter schema nor the response schema
//     carries property schemas.
func TestSyntheticParameterPropertySchemasBakeTypiaValueSchemas(t *testing.T) {
	const controller = `import core from "@nestia/core";
import { tags } from "typia";

interface IQuery {
  /** @x-foo bar */
  from: string & tags.Format<"date-time">;
  limit: number & tags.Minimum<1> & tags.Maximum<100> & tags.Default<10>;
  int32: number & tags.Type<"int32">;
  tpl: ` + "`prefix-${number}`" + `;
  ids: Array<string & tags.Format<"uuid">> & tags.MinItems<1>;
  nested: { value: string };
  callback: () => void;
  /** @internal */
  internal: string;
  /** @hidden */
  hidden: string;
  /** @ignore */
  ignored: string;
}

export class SyntheticController {
  @core.TypedRoute.Get("query")
  public query(@core.TypedQuery() query: IQuery): IQuery {
    return query;
  }
}
`
	metadata := decodeSyntheticMetadata(t, buildSyntheticMetadata(t, controller))
	parameter := syntheticField(t, metadata, "parameters").([]any)[0]

	properties, ok := syntheticJsonSchema(t, parameter, "resolved")["properties"].(map[string]any)
	if !ok {
		t.Fatalf("resolved parameter schema carries no property schemas\n%v", parameter)
	}
	expected := map[string]any{
		"from": map[string]any{"type": "string", "format": "date-time", "x-foo": "bar"},
		"limit": map[string]any{
			"type":    "number",
			"minimum": 1.0,
			"maximum": 100.0,
			"default": 10.0,
		},
		"int32": map[string]any{"type": "integer"},
		"ids": map[string]any{
			"type":     "array",
			"items":    map[string]any{"type": "string", "format": "uuid"},
			"minItems": 1.0,
		},
		"nested": map[string]any{
			"type":                 "object",
			"properties":           map[string]any{"value": map[string]any{"type": "string"}},
			"required":             []any{"value"},
			"additionalProperties": false,
		},
	}
	for key, schema := range expected {
		if reflect.DeepEqual(properties[key], schema) == false {
			t.Fatalf("property %q baked %v, expected %v", key, properties[key], schema)
		}
	}
	if tpl, _ := properties["tpl"].(map[string]any); tpl["type"] != "string" || tpl["pattern"] == nil {
		t.Fatalf("template literal property lost its pattern: %v", properties["tpl"])
	}
	for _, key := range []string{"callback", "internal", "hidden", "ignored"} {
		if _, exists := properties[key]; exists {
			t.Fatalf("property %q, which typia's object schema omits, was baked: %v", key, properties[key])
		}
	}
	if len(properties) != len(expected)+1 {
		t.Fatalf("expected %d property schemas, got %d: %v", len(expected)+1, len(properties), properties)
	}

	if _, exists := syntheticJsonSchema(t, parameter, "primitive")["properties"]; exists {
		t.Fatal("primitive parameter schema must not carry property schemas")
	}
	success := syntheticField(t, metadata, "success")
	for _, pipe := range []string{"primitive", "resolved"} {
		if _, exists := syntheticJsonSchema(t, success, pipe)["properties"]; exists {
			t.Fatalf("%s response schema must not carry property schemas", pipe)
		}
	}
}
