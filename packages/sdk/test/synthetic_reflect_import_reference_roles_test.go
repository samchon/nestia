package test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// Verifies reflected imports follow references rather than literal or member text.
//
// Removing a built-in-name whitelist must preserve actual imported Date and
// Array bindings without inventing those imports from similarly spelled text.
//
//  1. Analyze named, aliased, namespace and default bindings through a re-export.
//  2. Compare their imports with typeof/template references and literal controls.
//
// @evidence contracts/testing.md#behavioral-verification EmitTransform preserves named, renamed, namespace and default re-export bindings and imported typeof/template references, while literals, property names, template text and the real library Date contribute no import.
// @evidence contracts/testing.md#independent-expectations The authored TypeScript imports establish each source binding and rename; only actual type/value references need those bindings, whereas string values and member labels do not refer to the imported declarations.
// @evidence contracts/testing.md#distinguishing-cases Exact singleton binding fields and declaring paths contrast six reference forms with four empty-import controls, including built-in-name strings and qualified-name strings that would match the old lexical scanner.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this native analysis Test; three authored files are parse/checker input to EmitTransform, and the program is closed without product compilation, binary, installation or host.
func TestSyntheticReflectImportReferenceRoles(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	if err := os.MkdirAll(filepath.Join(temp, "src"), 0o755); err != nil {
		t.Fatal(err)
	}
	files := map[string]string{
		"model.ts": `export interface Date<T> { value: T; }
export default interface Array<T> { items: T; }
export const sample = { value: "text" };
export type DateLiteral = "a" | "b";
`,
		"barrel.ts": `export { Date, sample, DateLiteral, default } from "./model";`,
		"SyntheticController.ts": `import core from "@nestia/core";
import Array, { Date, Date as RenamedDate, sample, DateLiteral } from "./barrel";
import * as NS from "./barrel";
export class SyntheticController {
  @core.TypedRoute.Get("named")
  public named(): Date<string> { return null!; }
  @core.TypedRoute.Get("renamed")
  public renamed(): RenamedDate<string> { return null!; }
  @core.TypedRoute.Get("namespace")
  public namespace(): NS.Date<string> { return null!; }
  @core.TypedRoute.Get("default")
  public defaultValue(): Array<string> { return null!; }
  @core.TypedRoute.Get("query")
  public query(): typeof sample { return sample; }
  @core.TypedRoute.Get("template-reference")
  public templateReference(): ` + "`${DateLiteral}`" + ` { return "a"; }
  @core.TypedRoute.Get("literal")
  public literal(): "Date" | "NS.Date" { return "Date"; }
  @core.TypedRoute.Get("members")
  public members(): { Date: string; sample: number } { return { Date: "x", sample: 1 }; }
  @core.TypedRoute.Get("template-text")
  public templateText(): ` + "`Date-${string}`" + ` { return "Date-x"; }
  @core.TypedRoute.Get("native")
  public native(): globalThis.Date { return null!; }
}
`,
	}
	for file, source := range files {
		if err := os.WriteFile(filepath.Join(temp, "src", file), []byte(source), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	writeSyntheticTsconfig(t, root, temp)
	prog, diagnostics, err := driver.LoadProgram(temp, "tsconfig.json", driver.LoadProgramOptions{})
	if err != nil {
		t.Fatal(err)
	}
	defer prog.Close()
	if len(diagnostics) != 0 {
		t.Fatalf("configuration diagnostics = %v", diagnostics)
	}
	literals := collectEmittedMetadata(t, prog)
	if len(literals) != 10 {
		t.Fatalf("expected ten operations, got %d", len(literals))
	}
	for index, expected := range []string{
		`{"asterisk":null,"default":null,"elements":["Date"]}`,
		`{"asterisk":null,"default":null,"elementAliases":{"RenamedDate":"Date"},"elements":["RenamedDate"]}`,
		`{"asterisk":"NS","default":null,"elements":[]}`,
		`{"asterisk":null,"default":"Array","elements":[]}`,
		`{"asterisk":null,"default":null,"elements":["sample"]}`,
		`{"asterisk":null,"default":null,"elements":["DateLiteral"]}`,
	} {
		success := syntheticField(t, decodeSyntheticMetadata(t, literals[index]), "success")
		imports := syntheticField(t, success, "imports").([]any)
		if len(imports) != 1 {
			t.Errorf("operation %d imports = %v, want one authored binding", index, imports)
			continue
		}
		entry := imports[0].(map[string]any)
		file := syntheticField(t, entry, "file")
		if file != filepath.ToSlash(filepath.Join(temp, "src", "barrel")) {
			t.Errorf("operation %d import file = %v, want authored re-export", index, file)
		}
		delete(entry, "file")
		if actual := canonicalJSON(t, entry); actual != expected {
			t.Errorf("operation %d binding = %s, want %s", index, actual, expected)
		}
	}
	for index := 6; index < len(literals); index++ {
		success := syntheticField(t, decodeSyntheticMetadata(t, literals[index]), "success")
		if actual := canonicalJSON(t, syntheticField(t, success, "imports")); actual != `[]` {
			t.Errorf("operation %d non-reference control imports = %s, want empty", index, actual)
		}
	}
}
