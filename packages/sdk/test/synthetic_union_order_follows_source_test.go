package test

import (
	"encoding/json"
	"reflect"
	"sort"
	"testing"
)

// Verifies the metadata of a union return type lists its object and array
// members in the order the union writes them, not in the alphabetical order of
// the schema components, and keeps every tuple member.
//
// Union member order is observable: it becomes the order of the `oneOf`
// alternatives of the generated Swagger schema. typia collects the named schemas
// of the collection alphabetically, so nestiaSDKRestoreUnionOrder re-ranks
// metadata.objects by the position of each member in the union's type node. The
// objects below are declared in one order, written in the union in another and
// sorted alphabetically in a third, so only a restoration that follows the union
// text yields the expected list. The two array members are written number-last
// to differ from alphabetical order as well. The tuple members are asserted as a
// set only: tuple names are typia's element-name concatenation ("numberstring"),
// which no union member text spells, so their rank falls back to typia's own
// order. Their source order is observable in emitted lists but is not a
// TypeScript or OpenAPI validity requirement; this case checks tuple membership.
//
//  1. Author a controller returning a union of five named object types and
//     aliases, two arrays and two tuples, written in a non-alphabetical order.
//  2. Run the SDK metadata pass over it in-process.
//  3. Assert the objects and arrays follow the union text and the tuples are the
//     two written.
//
// @evidence contracts/testing.md#behavioral-verification EmitTransform's metadata for a union return type is decoded and the member name lists of metadata.objects and metadata.arrays are compared with the order the union is written in, so an unrestored typia order (alphabetical objects) or a dropped constituent is detected; the tuple list is compared as a set.
// @evidence contracts/testing.md#independent-expectations Named object ordering follows the SDK's existing presentation convention of restoring authored union order; the handwritten order differs from declaration and alphabetical order. Array and tuple membership follows the authored TypeScript constituents. oneOf validates exactly one alternative without assigning semantic precedence, so this case does not claim that tuple display order changes validity.
// @evidence contracts/testing.md#distinguishing-cases Five objects (interfaces and type aliases, in a third order than declared or sorted) and two arrays distinguish restoration from typia's native order; two one- and two-element tuples distinguish a lost tuple category; nested and reflected shapes are owned by the neighboring synthetic tests.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test. Its authored TypeScript program is loaded and analyzed in-process by EmitTransform with a temporary project and a closed program, without building a native artifact or starting an installed host; CLI/runtime cohorts separately own consumer assembly.
func TestSyntheticUnionOrderFollowsSource(t *testing.T) {
	const controller = `import core from "@nestia/core";

interface IAlpha { kind: "alpha"; a: number; }
interface IMid { kind: "mid"; m: number; }
interface IZeta { kind: "zeta"; z: number; }
type Omega = { kind: "omega"; o: string };
type Beta = { kind: "beta"; b: string };

export class SyntheticController {
  @core.TypedRoute.Get("union")
  public union(): IZeta | IAlpha | Omega | Beta | IMid | Array<string> | Array<number> | [number, string] | [boolean] {
    return null!;
  }
}
`
	meta := buildSyntheticMetadata(t, controller)
	decoded := decodeSyntheticMetadata(t, meta)
	success := syntheticField(t, decoded, "success")
	for _, pipe := range []string{"primitive", "resolved"} {
		data := syntheticField(t, syntheticField(t, success, pipe), "data")
		metadata := syntheticField(t, data, "metadata")
		if got, want := unionMemberNames(t, metadata, "objects"), []string{"IZeta", "IAlpha", "Omega", "Beta", "IMid"}; !reflect.DeepEqual(got, want) {
			t.Fatalf("%s objects are %v, want the union order %v", pipe, got, want)
		}
		if got, want := unionMemberNames(t, metadata, "arrays"), []string{"Arraystring", "Arraynumber"}; !reflect.DeepEqual(got, want) {
			t.Fatalf("%s arrays are %v, want the union order %v", pipe, got, want)
		}
		tuples := unionMemberNames(t, metadata, "tuples")
		sort.Strings(tuples)
		if want := []string{"boolean", "numberstring"}; !reflect.DeepEqual(tuples, want) {
			t.Fatalf("%s tuples are %v, want the members %v", pipe, tuples, want)
		}
	}
}

// unionMemberNames lists the names of one component family of a decoded
// metadata schema in the order the metadata holds them.
func unionMemberNames(t *testing.T, metadata any, family string) []string {
	t.Helper()
	items, ok := syntheticField(t, metadata, family).([]any)
	if !ok {
		t.Fatalf("metadata.%s is not a list", family)
	}
	names := make([]string, 0, len(items))
	for _, item := range items {
		name, ok := syntheticField(t, item, "name").(string)
		if !ok {
			encoded, _ := json.Marshal(item)
			t.Fatalf("metadata.%s member has no name: %s", family, encoded)
		}
		names = append(names, name)
	}
	return names
}
