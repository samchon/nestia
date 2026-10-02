package test

import (
	"strings"
	"testing"
)

// Verifies reflected metadata retains six authored type forms.
//
// Record, keyof, readonly array, parenthesized generic, generic keyof and
// intersection spellings exercise distinct syntax branches in EmitTransform.
// This test checks name presence across the collected metadata.
//
//  1. Author a controller whose methods return Record<...>, keyof, readonly[]
//     and a bare intersection.
//  2. Build it in-process with the SDK contributor active.
//  3. Assert each reflected type name appears in the metadata.
//
// @evidence contracts/testing.md#behavioral-verification Reflection must retain Record, keyof IPoint, readonly number[] and the IPoint intersection spelling in metadata for the authored routes.
// @evidence contracts/testing.md#independent-expectations These are distinct TypeScript type forms; their public reflected names preserve operator/generic/readonly meaning, and JSON escapes the intersection ampersand.
// @evidence contracts/testing.md#distinguishing-cases Six authored forms contrast mapped generic, key operator, readonly array intersection, parenthesized generic and generic key operator. This substring case checks category/name presence rather than complete per-route associations.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test. Its authored TypeScript program is loaded and analyzed in-process by EmitTransform with a temporary project and a closed program, without building a native artifact or starting an installed host; CLI/runtime cohorts separately own consumer assembly.
func TestSyntheticReflectTypeNamesRecordKeyofReadonlyIntersection(t *testing.T) {
	const controller = `import core from "@nestia/core";

interface IPoint {
  x: number;
  y: number;
}

export class SyntheticController {
  @core.TypedRoute.Get("record")
  public record(): Record<string, number> {
    return {};
  }

  @core.TypedRoute.Get("keyof")
  public keyof(): keyof IPoint {
    return "x";
  }

  @core.TypedRoute.Get("readonly")
  public readonlyArray(): readonly number[] {
    return [];
  }

  @core.TypedRoute.Get("parenthesized")
  public parenthesized(): (Record<string, number>) { return {}; }

  @core.TypedRoute.Get("generic-keyof")
  public genericKeyof(): keyof Record<string, number> { return "x"; }

  @core.TypedRoute.Get("intersection")
  public intersection(): IPoint & { z: number } {
    return { x: 0, y: 0, z: 0 };
  }
}
`
	meta := buildSyntheticMetadata(t, controller)
	// Marshal each independent spelling before looking in JSON metadata: Go
	// escapes <, > and & in string literals, although their type meaning stays.
	for _, expected := range []string{
		"Record", "keyof IPoint", "readonly number[]",
		"(Record<string, number>)", "keyof Record<string, number>",
		"IPoint & { z: number }",
	} {
		literal := canonicalJSON(t, expected)
		if !strings.Contains(meta, `"name":`+literal) {
			t.Fatalf("reflected type metadata is missing %q\n%s", expected, meta)
		}
	}
}
