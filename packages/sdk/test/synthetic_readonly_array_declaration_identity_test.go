package test

import (
	"strings"
	"testing"
)

// TestSyntheticReadonlyArrayDeclarationIdentity verifies readonly schema
// markers follow array semantics rather than a module-local declaration name.
//
// TypeScript modules may export an ordinary object named ReadonlyArray. That
// name cannot establish the identity of the default library array declaration.
//
//  1. Analyze a local ReadonlyArray object, readonly syntax, an actual library
//     ReadonlyArray through globalThis and a mutable array.
//  2. Read their actual baked response schemas and require the marker only on
//     the authored readonly array.
//
// @evidence contracts/testing.md#behavioral-verification EmitTransform must omit x-readonly-array from the module-local object and mutable array while retaining it on readonly syntax and the actual library ReadonlyArray through globalThis.
// @evidence contracts/testing.md#independent-expectations TypeScript permits module-local ReadonlyArray declarations, whose object members do not imply array immutability; readonly number[] is immutable and number[] is mutable independently of their generated schema spelling.
// @evidence contracts/testing.md#distinguishing-cases A colliding module-local name contrasts with readonly syntax, the actual qualified library declaration and a mutable negative twin. All four response schemas are inspected, so dropping every marker cannot pass.
// @evidence contracts/testing.md#execution-ownership The canonical SDK Go module discovers this Test, which runs EmitTransform through the existing in-process synthetic helper; the temporary program closes without consumer installation, native executable creation or a product host.
func TestSyntheticReadonlyArrayDeclarationIdentity(t *testing.T) {
	const controller = `import core from "@nestia/core";
export interface ReadonlyArray<T> { value: T; }
export class SyntheticController {
  @core.TypedRoute.Get("local")
  public local(): ReadonlyArray<string> { return null!; }
  @core.TypedRoute.Get("immutable")
  public immutable(): readonly number[] { return []; }
  @core.TypedRoute.Get("mutable")
  public mutable(): number[] { return []; }
  @core.TypedRoute.Get("library")
  public library(): globalThis.ReadonlyArray<number> { return []; }
}
`
	literals := strings.Split(buildSyntheticMetadata(t, controller), "\n")
	if len(literals) != 4 {
		t.Fatalf("expected four authored responses, got %d", len(literals))
	}
	for index, literal := range literals {
		metadata := decodeSyntheticMetadata(t, literal)
		baked := syntheticJsonSchema(t, syntheticField(t, metadata, "success"), "primitive")
		schema := syntheticField(t, baked, "schema").(map[string]any)
		marker, present := schema["x-readonly-array"]
		if index == 1 || index == 3 {
			if marker != true {
				t.Errorf("readonly array marker = %v, expected true", marker)
			}
		} else if present {
			t.Errorf("response %d has a readonly-array marker despite its mutable/object semantics: %v", index, marker)
		}
	}
}
