package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// TestSDKReflectImportsDefaultLibraryByProgram verifies the SDK reflect pass
// asks the program whether a declaration is a default library.
//
// A declaration whose path contained "/typescript/lib/" was taken for a default
// library and left out of the reflected imports, so a user type in such a folder
// was lost; a default library relocated by libReplacement would not match.
//
//  1. Author a controller inside a folder named typescript/lib that returns a
//     type declared in the same file and one returning the global Date.
//  2. Run the SDK metadata pass in-process.
//  3. Assert the local type is reflected as an import and Date is not.
//
// @evidence contracts/testing.md#behavioral-verification The metadata of the local-type route must carry the controller file as an import element and the Date route must carry none, so a path test and a missing library test each fail one assertion.
// @evidence contracts/testing.md#independent-expectations A user declaration needs its file imported while a global library type needs none; both expectations follow from TypeScript scoping.
// @evidence contracts/testing.md#distinguishing-cases The local type under the folder spelling is the positive case and the global Date is the negative twin in the same program.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test, which loads a temporary program and runs the contributor in-process without emitting files or starting a host.
func TestSDKReflectImportsDefaultLibraryByProgram(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	controllers := filepath.Join(temp, "src", "typescript", "lib")
	if err := os.MkdirAll(controllers, 0o755); err != nil {
		t.Fatal(err)
	}
	source := `import core from "@nestia/core";

interface ILocal { id: string; }

export class SyntheticController {
  @core.TypedRoute.Get("local")
  public local(): ILocal {
    return null!;
  }

  @core.TypedRoute.Get("lib")
  public lib(): Date {
    return new Date();
  }
}
`
	if err := os.WriteFile(filepath.Join(controllers, "SyntheticController.ts"), []byte(source), 0o644); err != nil {
		t.Fatal(err)
	}
	writeSyntheticTsconfig(t, root, temp)
	prog, diags, err := driver.LoadProgram(temp, "tsconfig.json", driver.LoadProgramOptions{})
	if err != nil {
		t.Fatal(err)
	}
	if len(diags) > 0 {
		t.Fatalf("unexpected load diagnostics: %v", diags)
	}
	defer prog.Close()
	literals := collectEmittedMetadata(t, prog)
	if len(literals) != 2 {
		t.Fatalf("expected 2 operations, got %d", len(literals))
	}
	if !strings.Contains(literals[0], "SyntheticController") || !strings.Contains(literals[0], `"elements":["ILocal"]`) {
		t.Errorf("a declaration under a folder named typescript/lib was taken for a default library:\n%s", literals[0])
	}
	if strings.Contains(literals[1], `"elements":["Date"]`) {
		t.Errorf("a default library declaration was reflected as an import:\n%s", literals[1])
	}
}
