package test

import (
	"strings"
	"testing"
)

// Verifies the nested reflect-type arms in nestiaSDKReflectTypeNode: a
// parenthesized type, an array whose element is itself reflectable, and a type
// reference carrying type arguments all thread their inner reflection through
// correctly.
//
// nestiaSDKReflectTypeNode recurses for KindParenthesizedType, KindArrayType and
// the KindTypeReference type-argument arm, each merging the child's import
// literals back up. The earlier reflect tests only hit the flat Record/keyof/
// readonly/intersection cases; a parenthesized union element, an array of a
// reflectable element, and a generic Record threaded through these recursive arms
// stay otherwise dark. A synthetic controller is the only in-process driver, run
// through the exported EmitTransform with no disk emit.
//
//  1. Author methods returning a parenthesized union array, an array of keyof,
//     and a Record carrying a nested type argument.
//  2. Run the SDK metadata pass over it in-process.
//  3. Assert each reflected nested type name surfaces in the metadata.
//
// @evidence contracts/testing.md#behavioral-verification Reflected nested type metadata must retain a parenthesized union marker and the Record/IPoint identities instead of flattening away nested type structure.
// @evidence contracts/testing.md#independent-expectations The authored return types contain parenthesized literal unions, keyof arrays and Record<string, IPoint[]>; these type spellings follow TypeScript semantics independently of SDK output.
// @evidence contracts/testing.md#distinguishing-cases This checks selected union-wrapper and nested named-type presence, not a complete per-route type tree. The record/keyof test and WebSocket argument matrix own other exact nested identities.
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
	meta := buildSyntheticMetadata(t, controller)
	for _, expected := range []string{
		// The parenthesized union element reflects with its "(...)" wrapper.
		`"name":"(`,
		// Record threads its nested IPoint[] type argument.
		`"name":"Record"`,
		`"name":"IPoint"`,
	} {
		if !strings.Contains(meta, expected) {
			t.Fatalf("nested reflect-type metadata is missing %q\n%s", expected, meta)
		}
	}
}
