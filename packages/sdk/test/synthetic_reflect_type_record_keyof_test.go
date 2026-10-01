package test

import (
	"strings"
	"testing"
)

// Verifies the reflect-type switch in sdk_transform.go names Record, keyof,
// readonly and bare-intersection return annotations correctly in the injected
// OperationMetadata.
//
// nestiaSDKReflectTypeNode has a branch per AST node kind, and the type name it
// emits (the `type.name` field the SDK generator reads) is built differently for
// each: KindTypeReference threads type arguments through nestiaSDKReflectTypeText
// ("Record<string, number>"), KindTypeOperator prefixes the operand
// ("keyof ...", "readonly ..."), and KindIntersectionType joins members with
// " & ". No tests/test-sdk fixture writes these annotations, so without a
// synthetic controller the keyof/readonly/Record/intersection arms stay dark.
//
//  1. Author a controller whose methods return Record<...>, keyof, readonly[]
//     and a bare intersection.
//  2. Build it in-process with the SDK contributor active.
//  3. Assert each reflected type name appears in the metadata.
//
// @evidence contracts/testing.md#behavioral-verification Reflection must retain Record, keyof IPoint, readonly Array and the IPoint intersection spelling in metadata for the authored routes.
// @evidence contracts/testing.md#independent-expectations These are distinct TypeScript type forms; their public reflected names preserve operator/generic/readonly meaning, and JSON escapes the intersection ampersand.
// @evidence contracts/testing.md#distinguishing-cases Four authored forms contrast mapped generic, key operator, readonly array and intersection. This substring case checks category/name presence rather than complete per-route associations.
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

  @core.TypedRoute.Get("intersection")
  public intersection(): IPoint & { z: number } {
    return { x: 0, y: 0, z: 0 };
  }
}
`
	meta := buildSyntheticMetadata(t, controller)
	for _, expected := range []string{
		`"name":"Record"`,
		`"name":"keyof IPoint"`,
		`"name":"readonly Array"`,
		// Go's json.Marshal HTML-escapes the intersection joiner & to &
		// inside the metadata literal, so match the escaped form.
		"\"name\":\"IPoint \\u0026 {",
	} {
		if !strings.Contains(meta, expected) {
			t.Fatalf("reflected type metadata is missing %q\n%s", expected, meta)
		}
	}
}
