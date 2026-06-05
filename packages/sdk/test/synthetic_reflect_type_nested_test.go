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
