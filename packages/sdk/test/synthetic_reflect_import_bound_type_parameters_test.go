package test

import (
	"strings"
	"testing"
)

// Verifies locally bound type parameters cannot become declaration imports.
//
// Mapped and conditional annotations bind their own names. Those references
// have no exported module identity, unlike a neighboring exported interface.
//
//  1. Analyze mapped-key and inferred-type binders beside an exported type.
//  2. Require empty imports for binders and the declaration for the free type.
//
// @evidence contracts/testing.md#behavioral-verification EmitTransform must not invent K or T imports for mapped and infer binders, while the free IModel response retains exactly its exported declaration import.
// @evidence contracts/testing.md#independent-expectations TypeScript mapped keys and infer parameters are scoped inside their annotations; clients retain those binders in the type text and cannot import them from a module. The exported IModel is a free module reference.
// @evidence contracts/testing.md#distinguishing-cases Two distinct binding constructs contrast an ordinary exported interface; exact empty and singleton imports distinguish declaration references from locally bound names.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this direct native Test. Its authored source is parse/checker input to EmitTransform, and its temporary program closes without a product build, installation, native host or runtime consumer.
func TestSyntheticReflectImportBoundTypeParameters(t *testing.T) {
	const controller = `import core from "@nestia/core";
export interface IModel { value: string; }
export class SyntheticController {
  @core.TypedRoute.Get("mapped")
  public mapped(): { [K in "a" | "b"]: K } { return null!; }
  @core.TypedRoute.Get("infer")
  public inferred(): { value: ["text"] extends [infer T] ? T : never } { return null!; }
  @core.TypedRoute.Get("free")
  public free(): IModel { return null!; }
}
`
	literals := strings.Split(buildSyntheticMetadata(t, controller), "\n")
	if len(literals) != 3 {
		t.Fatalf("expected three operations, got %d", len(literals))
	}
	for index := 0; index < 2; index++ {
		success := syntheticField(t, decodeSyntheticMetadata(t, literals[index]), "success")
		if actual := canonicalJSON(t, syntheticField(t, success, "imports")); actual != `[]` {
			t.Errorf("operation %d bound-name imports = %s, want empty", index, actual)
		}
	}
	free := syntheticField(t, decodeSyntheticMetadata(t, literals[2]), "success")
	imports := syntheticField(t, free, "imports").([]any)
	if len(imports) != 1 || canonicalJSON(t, syntheticField(t, imports[0], "elements")) != `["IModel"]` {
		t.Fatalf("free exported type imports = %v, want exactly IModel", imports)
	}
}
