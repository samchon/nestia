package test

import (
	"encoding/json"
	"testing"
)

// Verifies the SDK metadata carries values JSON cannot hold: non-finite numbers
// no longer abort generation, JSON schemas write them as null, the way
// JavaScript's `JSON.stringify` does, and constant and type tag values keep
// them, and bigints, exactly.
//
// typia hands over NaN and ±Infinity wherever a type or a comment spells one:
// a JSDoc `@x-` extension whose text parses as a float (`NaN`, `Infinity`,
// `-Infinity`, `inf`), a numeric literal type or enum member such as `1e999`,
// and a type tag argument such as `tags.Minimum<1e999>`. The SDK serializes
// its metadata with encoding/json, which refuses those values, so a single one
// anywhere in the types a route reaches used to fail `nestia sdk` and
// `nestia swagger` for the whole project with "json: unsupported value".
//
// Two halves of the metadata differ. A JSON schema is document content, so
// the baked schemas and a tag's `schema` hold what a JSON document can: null
// in place of the value, with its key kept as `JSON.stringify({ a: NaN })`
// keeps it. A constant's or a tag's value is what the SDK generator writes a
// type back from, and a null there lost the sign and made a cloned DTO fail
// to compile, so it carries the JavaScript name, `"Infinity"` or
// `"-Infinity"`. A bigint value is carried as its digits for the same reason:
// typia marshals it as a JSON number, which `JSON.parse` rounds past 2^53.
// Finite numbers next to them stay numbers. A tag's target is the type it
// tags, not its value's, so an encoded tag value names the type it stands for,
// and a tag value that only looks like one, a number on a bigint or a digit
// string, is not marked.
//
//  1. Author a query object carrying every non-finite source next to finite
//     twins, and run the SDK metadata pass over it in-process.
//  2. Assert the component and the decomposed property schemas write each
//     non-finite value as a present null and keep the finite ones.
//  3. Assert the metadata literal writes the non-finite constant and type tag
//     values by name, the bigint ones as digits, each encoded tag value with
//     the type it stands for, and each tag's schema as a JSON schema, keeping
//     the finite and string ones as they are.
func TestSyntheticMetadataValuesJsonCannotHold(t *testing.T) {
	const controller = `import core from "@nestia/core";
import { tags } from "typia";

export enum Level {
  Unbounded = 1e999,
  One = 1,
}

export interface INonFinite {
  /** @x-nan NaN */
  nan: string;
  /** @x-inf Infinity */
  inf: string;
  /** @x-neg -Infinity */
  neg: string;
  /** @x-short inf */
  short: string;
  /** @x-finite 1.5 */
  finite: string;
  literal: 1e999;
  union: -1e999 | 1;
  level: Level;
  minimum: number & tags.Minimum<1e999>;
  fallback: number & tags.Default<1e999>;
  sample: number & tags.Example<-1e999>;
  samples: number & tags.Examples<{ big: 1e999; small: 1 }>;
  plugin: number & tags.JsonSchemaPlugin<{ "x-plugin": 1e999 }>;
  bounded: number & tags.Minimum<3>;
  big: 12345678901234567890n;
  ranged: bigint & tags.Maximum<5n>;
  sequenced: bigint & tags.Sequence<1>;
  named: number & tags.Example<"Infinity">;
  digits: bigint & tags.Example<"12345678901234567890">;
}

export class SyntheticController {
  @core.TypedRoute.Get("non-finite")
  public get(@core.TypedQuery() query: INonFinite): INonFinite {
    return query;
  }
}
`
	metadata := decodeSyntheticMetadata(t, buildSyntheticMetadata(t, controller))
	parameter := syntheticField(t, metadata, "parameters").([]any)[0]

	expected := map[string]string{
		"nan":      `{"type":"string","x-nan":null}`,
		"inf":      `{"type":"string","x-inf":null}`,
		"neg":      `{"type":"string","x-neg":null}`,
		"short":    `{"type":"string","x-short":null}`,
		"finite":   `{"type":"string","x-finite":1.5}`,
		"literal":  `{"const":null}`,
		"union":    `{"oneOf":[{"const":null},{"const":1}]}`,
		"level":    `{"oneOf":[{"const":null},{"const":1}]}`,
		"minimum":  `{"minimum":null,"type":"number"}`,
		"fallback": `{"default":null,"type":"number"}`,
		"sample":   `{"example":null,"type":"number"}`,
		"samples":  `{"examples":{"big":null,"small":1},"type":"number"}`,
		"plugin":   `{"type":"number","x-plugin":null}`,
		"bounded":  `{"minimum":3,"type":"number"}`,
	}
	baked := syntheticJsonSchema(t, parameter, "resolved")
	component := syntheticField(t, syntheticField(t, syntheticField(t, baked, "components"), "schemas"), "INonFinite")
	for label, properties := range map[string]any{
		"component":  syntheticField(t, component, "properties"),
		"decomposed": syntheticField(t, baked, "properties"),
	} {
		for key, schema := range expected {
			if actual := canonicalJSON(t, syntheticField(t, properties, key)); actual != schema {
				t.Fatalf("%s property %q is %s, expected %s", label, key, actual, schema)
			}
		}
	}

	data := syntheticField(t, syntheticField(t, parameter, "resolved"), "data")
	objects := syntheticField(t, syntheticField(t, data, "components"), "objects").([]any)
	values := map[string]string{}
	tags := map[string]string{}
	for _, property := range syntheticField(t, objects[0], "properties").([]any) {
		key := syntheticMetadataConstant(t, syntheticField(t, property, "key"))
		value := syntheticField(t, property, "value")
		if constants := syntheticField(t, value, "constants").([]any); len(constants) != 0 {
			values[key.(string)] = canonicalJSON(t, syntheticConstantValues(t, constants[0]))
		}
		if atomics := syntheticField(t, value, "atomics").([]any); len(atomics) != 0 {
			for _, row := range syntheticField(t, atomics[0], "tags").([]any) {
				for _, tag := range row.([]any) {
					entry := map[string]any{
						"value":  syntheticField(t, tag, "value"),
						"schema": syntheticField(t, tag, "schema"),
					}
					if encoding, ok := tag.(map[string]any)["encoding"]; ok {
						entry["encoding"] = encoding
					}
					tags[key.(string)] = canonicalJSON(t, entry)
				}
			}
		}
	}
	for key, value := range map[string]string{
		"literal": `["Infinity"]`,
		"union":   `["-Infinity",1]`,
		"level":   `["Infinity",1]`,
		"big":     `["12345678901234567890"]`,
	} {
		if values[key] != value {
			t.Fatalf("metadata constant %q values are %s, expected %s", key, values[key], value)
		}
	}
	for key, tag := range map[string]string{
		"minimum":   `{"encoding":"number","schema":{"minimum":null},"value":"Infinity"}`,
		"fallback":  `{"encoding":"number","schema":{"default":null},"value":"Infinity"}`,
		"sample":    `{"encoding":"number","schema":{"example":null},"value":"-Infinity"}`,
		"plugin":    `{"schema":{"x-plugin":null},"value":null}`,
		"bounded":   `{"schema":{"minimum":3},"value":3}`,
		"ranged":    `{"encoding":"bigint","schema":{"maximum":5},"value":"5"}`,
		"sequenced": `{"schema":{"x-protobuf-sequence":1},"value":1}`,
		"named":     `{"schema":{"example":"Infinity"},"value":"Infinity"}`,
		"digits":    `{"schema":{"example":"12345678901234567890"},"value":"12345678901234567890"}`,
	} {
		if tags[key] != tag {
			t.Fatalf("metadata type tag of %q is %s, expected %s", key, tags[key], tag)
		}
	}
}

// syntheticMetadataConstant reads the sole constant value of a metadata
// literal, such as a property key.
func syntheticMetadataConstant(t *testing.T, metadata any) any {
	t.Helper()
	constants := syntheticField(t, metadata, "constants").([]any)
	return syntheticField(t, syntheticField(t, constants[0], "values").([]any)[0], "value")
}

// syntheticConstantValues lists the values of one metadata constant entry.
func syntheticConstantValues(t *testing.T, constant any) []any {
	t.Helper()
	output := []any{}
	for _, value := range syntheticField(t, constant, "values").([]any) {
		output = append(output, syntheticField(t, value, "value"))
	}
	return output
}

// canonicalJSON prints a decoded value with sorted object keys.
func canonicalJSON(t *testing.T, value any) string {
	t.Helper()
	data, err := json.Marshal(value)
	if err != nil {
		t.Fatal(err)
	}
	return string(data)
}
