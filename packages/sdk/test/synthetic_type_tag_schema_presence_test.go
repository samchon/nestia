package test

import "testing"

// TestSyntheticTypeTagSchemaPresence verifies optional tag schemas survive the
// native SDK metadata operation without converting absence into JSON null.
//
// TagBase permits an absent or undefined schema, an empty object and an object
// containing instance-valued null leaves. Generated clones must retain these
// distinctions: schema:null itself is rejected by typia's tag analyzer, whereas
// null inside a schema example is valid content (typia#2403).
//
//  1. Analyze four custom string tags through one authored controller/program.
//  2. Read each property's actual emitted OperationMetadata tag object.
//  3. Compare schema presence and content with independently authored literals,
//     while checking the validation and exclusivity payload remains intact.
//
// @evidence contracts/testing.md#behavioral-verification EmitTransform serializes real analyzed custom tags; absent schema members must be absent in its JSON, empty objects must remain objects, and nested null content must remain null.
// @evidence contracts/testing.md#independent-expectations TagBase.IProps schema is optional object-or-undefined. The authored four declarations independently specify absent, undefined, empty-object and populated-object outcomes; literal validation/target/value/exclusive expectations come from those declarations.
// @evidence contracts/testing.md#distinguishing-cases Absent and explicit undefined contrast with an empty object and an object containing scalar schema fields plus null object/array example leaves. Invalid top-level schema:null and scalar schema are rejected by the upstream tag analyzer, not accepted or suppressed by this positive SDK serialization unit. Existing integrated custom-tag cases own valid hexadecimal/even-length values and invalid odd-length/character HTTP validation.
// @evidence contracts/testing.md#execution-ownership The canonical SDK Go test module discovers this single Test. Existing buildSyntheticMetadata loads one temporary TypeScript program and calls the actual native SDK EmitTransform in-process, closes the program and cleans temporary inputs; no compiler backend, installed consumer, JavaScript emit or HTTP host is created.
func TestSyntheticTypeTagSchemaPresence(t *testing.T) {
	const controller = `import core from "@nestia/core";
import { tags } from "typia";

type AbsentSchema = tags.TagBase<{
  target: "string"; kind: "absentSchema"; value: 2;
  validate: "$input.length % 2 === 0"; exclusive: false;
}>;
type UndefinedSchema = tags.TagBase<{
  target: "string"; kind: "undefinedSchema"; value: 2;
  validate: "$input.length % 2 === 0"; exclusive: false; schema: undefined;
}>;
type EmptySchema = tags.TagBase<{
  target: "string"; kind: "emptySchema"; value: 2;
  validate: "$input.length % 2 === 0"; exclusive: false; schema: {};
}>;
type PopulatedSchema = tags.TagBase<{
  target: "string"; kind: "populatedSchema"; value: 2;
  validate: "$input.length % 2 === 0"; exclusive: false;
  schema: { minLength: 2; example: { note: null; items: [null] } };
}>;
export interface ITagged {
  absent: string & AbsentSchema;
  undefined: string & UndefinedSchema;
  empty: string & EmptySchema;
  populated: string & PopulatedSchema;
}
export class SyntheticController {
  @core.TypedRoute.Post("tag-schema")
  public store(@core.TypedBody() input: ITagged): void {}
}
`
	metadata := decodeSyntheticMetadata(t, buildSyntheticMetadata(t, controller))
	parameters := syntheticField(t, metadata, "parameters").([]any)
	if len(parameters) != 1 {
		t.Fatalf("expected one body parameter, got %d", len(parameters))
	}
	data := syntheticField(t, syntheticField(t, parameters[0], "resolved"), "data")
	objects := syntheticField(t, syntheticField(t, data, "components"), "objects").([]any)
	if len(objects) != 1 {
		t.Fatalf("expected the single authored ITagged object, got %d", len(objects))
	}
	properties := syntheticField(t, objects[0], "properties").([]any)
	if len(properties) != 4 {
		t.Fatalf("expected four independently authored properties, got %d", len(properties))
	}
	kinds := map[string]string{"absent": "absentSchema", "undefined": "undefinedSchema", "empty": "emptySchema", "populated": "populatedSchema"}
	names := map[string]string{"absent": "AbsentSchema", "undefined": "UndefinedSchema", "empty": "EmptySchema", "populated": "PopulatedSchema"}
	for _, property := range properties {
		key := syntheticMetadataConstant(t, syntheticField(t, property, "key")).(string)
		kind, exists := kinds[key]
		if !exists {
			t.Fatalf("unexpected property %q", key)
		}
		delete(kinds, key)
		atomics := syntheticField(t, syntheticField(t, property, "value"), "atomics").([]any)
		if len(atomics) != 1 {
			t.Fatalf("%s: expected one string atomic, got %d", key, len(atomics))
		}
		rows := syntheticField(t, atomics[0], "tags").([]any)
		if len(rows) != 1 || len(rows[0].([]any)) != 1 {
			t.Fatalf("%s: expected one tag in one row, got %v", key, rows)
		}
		tag := rows[0].([]any)[0].(map[string]any)
		t.Logf("%s actual tag: %s", key, canonicalJSON(t, tag))
		for field, expected := range map[string]any{"target": "string", "kind": kind, "value": float64(2), "validate": "$input.length % 2 === 0", "exclusive": false} {
			if actual := syntheticField(t, tag, field); actual != expected {
				t.Errorf("%s tag %s = %v, expected %v", key, field, actual, expected)
			}
		}
		if name := tag["name"]; name != names[key] {
			t.Errorf("%s: analyzed tag name is %v, expected authored declaration %q", key, name, names[key])
		}
		schema, present := tag["schema"]
		switch key {
		case "absent", "undefined":
			if present {
				t.Errorf("%s: schema must be absent, got %s", key, canonicalJSON(t, schema))
			}
		case "empty":
			if !present || canonicalJSON(t, schema) != `{}` {
				t.Errorf("empty: schema must be the explicit empty object, got present=%t value=%v", present, schema)
			}
		case "populated":
			if !present || canonicalJSON(t, schema) != `{"example":{"items":[null],"note":null},"minLength":2}` {
				t.Errorf("populated: schema content must preserve null instance leaves, got present=%t value=%v", present, schema)
			}
		}
	}
	if len(kinds) != 0 {
		t.Fatalf("missing authored properties: %v", kinds)
	}
}
