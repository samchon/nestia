package test

import (
	"strings"
	"testing"
)

// Verifies nested type annotations retain their reflected type trees.
//
// A parenthesized union array, a keyof array and a nested Record argument
// exercise distinct recursive syntax branches through native EmitTransform.
//
//  1. Author methods returning a parenthesized union array, an array of keyof,
//     and a Record carrying a nested type argument.
//  2. Run the SDK metadata pass over it in-process.
//  3. Assert each success type tree equals the nested type its annotation spells.
//
// @evidence contracts/testing.md#behavioral-verification The success type tree of each reflected nested annotation must equal the tree its spelling denotes, with the parenthesized union and keyof element names, and Record carrying string and Array<IPoint> arguments, instead of flattening away nested type structure.
// @evidence contracts/testing.md#independent-expectations The authored return types contain parenthesized literal unions, keyof arrays and Record<string, IPoint[]>; these type spellings follow TypeScript semantics independently of SDK output.
// @evidence contracts/testing.md#distinguishing-cases The three annotations are compared as complete type trees, one literal per method. The record/keyof test and WebSocket argument matrix own other exact nested identities.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test. Its authored TypeScript program is loaded and analyzed in-process by EmitTransform with a temporary project and a closed program, without building a native artifact or starting an installed host; CLI/runtime cohorts separately own consumer assembly.
func TestSyntheticReflectTypeNestedArms(t *testing.T) {
	const controller = `import core from "@nestia/core";

interface IPoint { x: number; y: number; }

export class SyntheticController {
  @core.TypedRoute.Get("paren")
  public paren(): ("a" | "b")[] {
    return [];
  }

  @core.TypedRoute.Get("keyofArray")
  public keyofArray(): (keyof IPoint)[] {
    return [];
  }

  @core.TypedRoute.Get("record")
  public record(): Record<string, IPoint[]> {
    return {};
  }
}
`
	// One metadata literal per method, in source order; each success type is the
	// reflected tree TypeScript spells for the annotation.
	expected := []string{
		`{"name":"Array","typeArguments":[{"name":"(\"a\" | \"b\")"}]}`,
		`{"name":"Array","typeArguments":[{"name":"(keyof IPoint)"}]}`,
		`{"name":"Record","typeArguments":[{"name":"string"},{"name":"Array","typeArguments":[{"name":"IPoint"}]}]}`,
	}
	literals := strings.Split(buildSyntheticMetadata(t, controller), "\n")
	if len(literals) != len(expected) {
		t.Fatalf("expected %d operations, got %d", len(expected), len(literals))
	}
	for index, literal := range literals {
		success := syntheticField(t, decodeSyntheticMetadata(t, literal), "success")
		if actual := canonicalJSON(t, syntheticField(t, success, "type")); actual != expected[index] {
			t.Fatalf("operation %d success type is %s, expected %s", index, actual, expected[index])
		}
	}
}
