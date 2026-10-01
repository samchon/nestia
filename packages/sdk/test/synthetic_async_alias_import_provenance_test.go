package test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// Verifies imported async aliases preserve the payload's re-export binding.
//
// The concrete response belongs to the payload declaration, even when the
// Promise or rxjs Observable wrapper reaches the controller through a barrel.
//
//  1. Analyze named/defaulted/chained and Observable aliases from a re-export.
//  2. Require the renamed payload import and retain a foreign Observable alias.
//
// @evidence contracts/testing.md#behavioral-verification EmitTransform must replace imported direct/defaulted/chained Promise and rxjs Observable aliases with PointAlias and its exact barrel binding, while preserving OpaqueObserved<PointAlias> for the user-owned nonthenable wrapper.
// @evidence contracts/testing.md#independent-expectations TypeScript exports IPoint as RenamedPoint and the controller imports that export as PointAlias; awaiting library Promise or the supported rxjs Observable exposes that payload. The authored foreign Observable declaration is owned by model.ts rather than the rxjs manifest and remains an ordinary object.
// @evidence contracts/testing.md#distinguishing-cases Four async import forms contrast a foreign same-spelled wrapper alias; complete payload trees, renamed import fields and declaration paths distinguish source binding loss from wrapper provenance overmatching. Local/default/conditional/nested aliases belong to the companion return-type test.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this Test. A small authored rxjs manifest and declaration are resolver/checker input alongside three module files; one LoadProgram and EmitTransform run in-process and close without a consumer install, product build or host.
func TestSyntheticAsyncAliasImportProvenance(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	files := map[string]string{
		"node_modules/rxjs/package.json": `{"name":"rxjs","types":"index.d.ts"}`,
		"node_modules/rxjs/index.d.ts":   `export interface Observable<T> { readonly marker: T; }`,
		"src/model.ts": `import { Observable } from "rxjs";
export interface IPoint { x: number; }
export type Async<T = IPoint> = Promise<T>;
export type Chained<T> = Async<T>;
export type Observed<T> = Observable<T>;
export namespace Foreign { export interface Observable<T> { value: T; } }
export type OpaqueObserved<T> = Foreign.Observable<T>;
`,
		"src/barrel.ts": `export { Async as Reexported, Chained, Observed, OpaqueObserved, IPoint as RenamedPoint } from "./model";`,
		"src/SyntheticController.ts": `import core from "@nestia/core";
import { Reexported, Chained, Observed, OpaqueObserved, RenamedPoint as PointAlias } from "./barrel";
export class SyntheticController {
  @core.TypedRoute.Get("direct")
  public direct(): Reexported<PointAlias> { return null!; }
  @core.TypedRoute.Get("default")
  public defaulted(): Reexported { return null!; }
  @core.TypedRoute.Get("chained")
  public chained(): Chained<PointAlias> { return null!; }
  @core.TypedRoute.Get("observable")
  public observable(): Observed<PointAlias> { return null!; }
  @core.TypedRoute.Get("foreign")
  public foreign(): OpaqueObserved<PointAlias> { return null!; }
}
`,
	}
	for file, text := range files {
		absolute := filepath.Join(temp, file)
		if err := os.MkdirAll(filepath.Dir(absolute), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(absolute, []byte(text), 0o644); err != nil {
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
	if len(literals) != 5 {
		t.Fatalf("expected five operations, got %d", len(literals))
	}
	for index := 0; index < 4; index++ {
		success := syntheticField(t, decodeSyntheticMetadata(t, literals[index]), "success")
		if actual := canonicalJSON(t, syntheticField(t, success, "type")); actual != `{"name":"PointAlias"}` {
			t.Errorf("operation %d payload type = %s, want PointAlias", index, actual)
		}
		imports := syntheticField(t, success, "imports").([]any)
		if len(imports) != 1 {
			t.Errorf("operation %d imports = %v, want one payload binding", index, imports)
			continue
		}
		entry := imports[0].(map[string]any)
		if syntheticField(t, entry, "file") != filepath.ToSlash(filepath.Join(temp, "src/barrel")) {
			t.Errorf("operation %d payload import lost its authored barrel: %v", index, entry)
		}
		delete(entry, "file")
		if actual := canonicalJSON(t, entry); actual != `{"asterisk":null,"default":null,"elementAliases":{"PointAlias":"RenamedPoint"},"elements":["PointAlias"]}` {
			t.Errorf("operation %d payload binding = %s", index, actual)
		}
	}
	foreign := syntheticField(t, decodeSyntheticMetadata(t, literals[4]), "success")
	if actual := canonicalJSON(t, syntheticField(t, foreign, "type")); actual != `{"name":"OpaqueObserved","typeArguments":[{"name":"PointAlias"}]}` {
		t.Fatalf("foreign Observable alias lost its ordinary wrapper: %s", actual)
	}
}
