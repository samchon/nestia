package test

import (
	"sort"
	"strings"
	"testing"
)

// TestSyntheticParameterHttpRules verifies the SDK bakes, for every route
// parameter, the violations of each HTTP input category's rules, and nothing
// for a type the category accepts.
//
// A vanilla `@Query()`, `@Headers()`, or `@Param()` reaches no transform, so
// since v13 the SDK accepted types no query string, header, or path segment can
// carry, and generated SDKs that sent `[object Object]` (#1648). The SDK cannot
// see decorators, so it bakes the verdict of every category and lets the
// analyzer pick one. Query, headers, and form data run typia's own validators;
// the path parameter rule (unexported in typia) and the field-named rule are
// written in nestia, so each is pinned with an accepted twin beside every
// rejected shape, and the accessor naming the offending property is asserted
// too. A `Date` property is judged as the transform judges it, a native
// object, although the SDK's own metadata of the same type already holds the
// string its JSON escapes it to.
//
//  1. Author one route whose parameters are a flat object, objects with a
//     nested object, a dynamic key, a union, a nullable property, and a
//     `Date`, an atomic, an array of atomics, a field object, an array of
//     field objects, and a union of atomics.
//  2. Run the SDK metadata pass over it in-process.
//  3. Assert each parameter's verdict per category.
func TestSyntheticParameterHttpRules(t *testing.T) {
	const controller = `import core from "@nestia/core";
import { Query } from "@nestjs/common";

export interface IFlat { a: string; b?: number; c: string[] }
export interface INested { filter: { section: string } }
export interface IDynamic { [key: string]: string }
export type IUnion = { a: string } | { b: string };
export interface INullable { "x-a": string | null }
export interface IDated { when?: Date }

export class SyntheticController {
  @core.TypedRoute.Get("rules")
  public rules(
    @Query() flat: IFlat,
    @Query() nested: INested,
    @Query() dynamic: IDynamic,
    @Query() union: IUnion,
    @Query() nullable: INullable,
    @Query() dated: IDated,
    @Query("id") id: string,
    @Query("ids") ids: string[],
    @Query("object") object: { section: string },
    @Query("objects") objects: Array<{ section: string }>,
    @Query("either") either: string | number,
  ): void {}
}
`
	metadata := decodeSyntheticMetadata(t, buildSyntheticMetadata(t, controller))
	verdicts := map[string]map[string][]string{}
	for _, parameter := range syntheticField(t, metadata, "parameters").([]any) {
		name := syntheticField(t, parameter, "name").(string)
		data := syntheticField(t, syntheticField(t, parameter, "resolved"), "data")
		rules := syntheticField(t, data, "http").(map[string]any)
		verdicts[name] = map[string][]string{}
		for category, errors := range rules {
			lines := []string{}
			for _, err := range errors.([]any) {
				accessor, _ := syntheticField(t, err, "accessor").(string)
				for _, message := range syntheticField(t, err, "messages").([]any) {
					lines = append(lines, accessor+": "+message.(string))
				}
			}
			sort.Strings(lines)
			verdicts[name][category] = lines
		}
	}

	for _, expected := range []struct {
		parameter string
		category  string
		lines     []string
	}{
		// query objects
		{"flat", "query", nil},
		{"flat", "headers", nil},
		{"flat", "formData", nil},
		{"nested", "query", []string{"INested.filter: nested object type is not allowed."}},
		{"nested", "headers", []string{"INested.filter: nested object type is not allowed."}},
		{"dynamic", "query", []string{"IDynamic[key]: dynamic property is not allowed."}},
		{"union", "query", []string{": only one object type is allowed."}},
		{"nullable", "query", nil},
		{"nullable", "headers", []string{`INullable["x-a"]: nullable type is not allowed.`}},
		{"dated", "query", []string{"IDated.when: nested object type is not allowed."}},
		// field-named parameters
		{"id", "field", nil},
		{"ids", "field", nil},
		{"flat", "field", []string{": only atomic or array of atomic types are allowed."}},
		{"object", "field", []string{": only atomic or array of atomic types are allowed."}},
		{"objects", "field", []string{": only atomic types are allowed in array."}},
		// path parameters
		{"id", "param", nil},
		{"either", "param", []string{": do not allow union type"}},
		{"ids", "param", []string{": only atomic or constant types are allowed"}},
	} {
		actual := verdicts[expected.parameter][expected.category]
		if strings.Join(actual, "\n") != strings.Join(expected.lines, "\n") {
			t.Fatalf(
				"%s under the %s rules: got %q, expected %q",
				expected.parameter, expected.category, actual, expected.lines,
			)
		}
	}
}
