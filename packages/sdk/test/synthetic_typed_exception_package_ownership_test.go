package test

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// TestSyntheticTypedExceptionPackageOwnership verifies foreign decorators do
// not become SDK exception types because their paths resemble core's layout.
//
// The SDK resolves decorator signatures through the shared core detector.
// Incorrect package ownership adds an unrelated exception to operation metadata,
// breaking the association with exceptions actually registered by nestia.
//
//  1. Author four foreign TypedException declarations and their package manifests.
//  2. Analyze four controllers carrying one real and one foreign exception each.
//  3. Require exactly the real IMissing exception in every operation metadata.
//
// @evidence contracts/testing.md#behavioral-verification The actual registered SDK EmitTransform must produce four metadata records and exactly one IMissing exception in each; recording a foreign decorator adds an independently detectable second exception.
// @evidence contracts/testing.md#independent-expectations Each authored controller explicitly registers one real TypedException<IMissing> and one unrelated TypedException<IForeign>; foreign manifests and actual core source resolution establish the expected one-element result before analysis.
// @evidence contracts/testing.md#distinguishing-cases Foreign workspace lib/source paths and foreign packages nested inside both installed-looking lib/source paths retain four negative controls; the actual core exception on each controller is the adjacent positive control. The core detector unit additionally covers relocated owners, re-exports and unresolved calls.
// @evidence contracts/testing.md#execution-ownership The canonical SDK Go runner discovers this matching Test and runs EmitTransform in-process against one real driver program. t.TempDir owns fixture files, defer closes the program, and no host, installed CLI or server is started.
func TestSyntheticTypedExceptionPackageOwnership(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	write := func(location, contents string) {
		t.Helper()
		file := filepath.Join(temp, filepath.FromSlash(location))
		if err := os.MkdirAll(filepath.Dir(file), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(file, []byte(contents), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	locations := []string{
		"packages/core/lib/foreign",
		"packages/core/src/decorators/foreign",
		"node_modules/@nestia/core/lib/foreign",
		"node_modules/@nestia/core/src/decorators/foreign",
	}
	write("src/node_modules/@nestia/core/package.json", `{"name":"@nestia/core"}`)
	var source strings.Builder
	source.WriteString("import { TypedException, TypedRoute } from '@nestia/core';\n")
	source.WriteString("interface IMissing { message: string; }\ninterface IForeign { unrelated: boolean; }\n")
	for index, location := range locations {
		write("src/"+location+"/package.json", `{"name":"foreign-decorators"}`)
		write("src/"+location+"/index.ts", `export declare function TypedException<T>(status: number): MethodDecorator;`)
		fmt.Fprintf(&source, "import * as Foreign%d from %q;\n", index, "./"+location)
		fmt.Fprintf(&source, `export class Controller%d {
  @Foreign%d.TypedException<IForeign>(409)
  @TypedException<IMissing>(404)
  @TypedRoute.Get()
  public get(): number { return 0; }
}
`, index, index)
	}
	write("src/main.ts", source.String())
	writeSyntheticTsconfig(t, root, temp)
	prog, diags, err := driver.LoadProgram(temp, "tsconfig.json", driver.LoadProgramOptions{})
	if err != nil {
		t.Fatal(err)
	}
	defer prog.Close()
	if len(diags) != 0 {
		t.Fatalf("configuration diagnostics: %v", diags)
	}
	metadata := collectEmittedMetadata(t, prog)
	if len(metadata) != len(locations) {
		t.Fatalf("metadata count = %d, want %d", len(metadata), len(locations))
	}
	for index, literal := range metadata {
		exceptions, ok := syntheticField(t, decodeSyntheticMetadata(t, literal), "exceptions").([]any)
		if !ok {
			t.Errorf("operation %d exceptions are not an array", index)
			continue
		}
		real := 0
		for _, exception := range exceptions {
			if name := syntheticField(t, syntheticField(t, exception, "type"), "name"); name == "IMissing" {
				real++
			}
		}
		if real != 1 {
			t.Errorf("operation %d real exception count = %d, want one IMissing", index, real)
		}
		if len(exceptions) != 1 {
			t.Errorf("operation %d exception count = %d, want only the real exception", index, len(exceptions))
		}
	}
}
