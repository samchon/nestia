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
