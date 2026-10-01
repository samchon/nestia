package test

import (
	"strings"
	"testing"
)

// Verifies module-local built-in-named declarations remain importable.
//
// Built-in spelling does not establish declaration provenance. Thirteen module exports
// with built-in names are user interfaces; globalThis.Date is the library type.
//
//  1. Analyze all thirteen local generic wrappers and a globalThis.Date response.
//  2. Require exactly the local declaration import and no library import.
//
// @evidence contracts/testing.md#behavioral-verification EmitTransform must preserve each of thirteen local built-in-named generic type trees and its exact declaring import while the adjacent globalThis.Date response imports nothing.
// @evidence contracts/testing.md#independent-expectations An exported generic interface in a TypeScript module retains local identity regardless of its name; every authored wrapper has a string type argument, while globalThis.Date is the library type available without imports.
// @evidence contracts/testing.md#distinguishing-cases All thirteen named built-in exclusions contrast module-local generic interfaces with actual library Date; exact type trees, empty/singleton collections and declaring files detect spelling suppression and library overcollection. Alias, namespace and re-export paths require complementary provenance controls.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this Test, which loads authored parse/checker input and invokes EmitTransform in-process without native binary, product build, consumer installation or host.
func TestSyntheticReflectImportsBuiltinNameCollision(t *testing.T) {
	names := []string{"Array", "ReadonlyArray", "Promise", "Record", "Partial", "Pick", "Omit", "Date", "File", "Blob", "Uint8Array", "ArrayBuffer", "Error"}
	var source strings.Builder
	source.WriteString(`import core from "@nestia/core";` + "\n")
	for _, name := range names {
		source.WriteString("export interface " + name + "<T> { value: T; }\n")
	}
	source.WriteString("export class SyntheticController {\n")
	for _, name := range names {
		source.WriteString(`  @core.TypedRoute.Get("local-` + name + `")` + "\n")
		source.WriteString("  public local" + name + "(): " + name + "<string> { return null!; }\n")
	}
	source.WriteString(`  @core.TypedRoute.Get("native")` + "\n")
	source.WriteString("  public native(): globalThis.Date { return null!; }\n}\n")
	literals := strings.Split(buildSyntheticMetadata(t, source.String()), "\n")
	if len(literals) != len(names)+1 {
		t.Fatalf("expected %d operations, got %d", len(names)+1, len(literals))
	}
	for index, name := range names {
		local := syntheticField(t, decodeSyntheticMetadata(t, literals[index]), "success")
		expected := `{"name":"` + name + `","typeArguments":[{"name":"string"}]}`
		if actual := canonicalJSON(t, syntheticField(t, local, "type")); actual != expected {
			t.Errorf("local %s type = %s, want %s", name, actual, expected)
		}
		imports := syntheticField(t, local, "imports").([]any)
		if len(imports) != 1 {
			t.Errorf("local %s imports = %v, want one declaring module", name, imports)
			continue
		}
		if actual := canonicalJSON(t, syntheticField(t, imports[0], "elements")); actual != `["`+name+`"]` {
			t.Errorf("local %s import elements = %s", name, actual)
		}
		file := syntheticField(t, imports[0], "file").(string)
		if !strings.HasSuffix(file, "/src/controllers/SyntheticController.ts") {
			t.Errorf("local %s declaration file = %q", name, file)
		}
	}
	native := syntheticField(t, decodeSyntheticMetadata(t, literals[len(names)]), "success")
	if actual := canonicalJSON(t, syntheticField(t, native, "imports")); actual != `[]` {
		t.Fatalf("library Date imports = %s, want empty collection", actual)
	}
}
