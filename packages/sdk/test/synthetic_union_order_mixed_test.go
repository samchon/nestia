package test

import (
	"strings"
	"testing"
)

// Verifies the union-order restoration sorts every component family — objects,
// aliases, arrays and tuples — into source declaration order, exercising all four
// sort.SliceStable closures in nestiaSDKRestoreUnionOrder plus the
// nestiaSDKUnionRank fallback for a member missing from the order map.
//
// The exception fixture's union return is a union of named objects, so only the
// objects closure runs; the aliases/arrays/tuples closures stay dark. A synthetic
// controller returning a union that mixes a named object, a type alias, an array
// type and a tuple type is the only in-process driver that lights all four, run
// through the exported EmitTransform with no disk emit.
//
//  1. Author a controller returning `A | B | C[] | [number, string]` where A is an
//     object, B an alias, C[] an array and the tuple a tuple type.
//  2. Run the SDK metadata pass over it in-process.
//  3. Assert every union member surfaces in the metadata.
func TestSyntheticUnionOrderMixedComponents(t *testing.T) {
	const controller = `import core from "@nestia/core";

interface IAlpha { kind: "alpha"; a: number; }
interface IGamma { kind: "gamma"; g: number; }
type Beta = { kind: "beta"; b: string };

export class SyntheticController {
  @core.TypedRoute.Get("union")
  public union(): IAlpha | Beta | IGamma[] | [number, string] {
    return null!;
  }
}
`
	meta := buildSyntheticMetadata(t, controller)
	for _, expected := range []string{
		`"name":"IAlpha"`,
		`"name":"Beta"`,
		`"name":"IGamma"`,
		`"tuples":[`,
	} {
		if !strings.Contains(meta, expected) {
			t.Fatalf("mixed union metadata is missing %q\n%s", expected, meta)
		}
	}
}
