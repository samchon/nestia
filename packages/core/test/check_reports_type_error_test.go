package test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestCheckReportsTypeError verifies the check subcommand surfaces a genuine
// tsgo type error as exit 2 via the prog.Diagnostics() branch.
//
// runCheck loads the program with ForceNoEmit and fails when either config
// diagnostics or type diagnostics are present; the type-diagnostics branch is
// the analysis half of the no-emit contract ttsc relies on for `--noEmit`. A
// clean feature never reaches it, so we synthesize a one-line type error in a
// temp source file (no tracked fixture) and assert check rejects it.
//
//  1. Write a temp .ts assigning a string to a number and a tsconfig including it.
//  2. Run check against it.
//  3. Assert the exit code is 2.
func TestCheckReportsTypeError(t *testing.T) {
	temp := t.TempDir()
	bad := filepath.Join(temp, "bad.ts")
	if err := os.WriteFile(bad, []byte("export const x: number = \"not a number\";\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	featureRoot := featureRootForCore(t, "body")
	tsconfig := writeExtendingTsconfig(t, temp, featureRoot, "", []string{bad})
	code := transform.Run([]string{
		"check",
		"--cwd", temp,
		"--tsconfig", tsconfig,
		"--plugins-json", coreNativePlugins("validate", "assert"),
	})
	if code != 2 {
		t.Fatalf("check should report a type error as exit 2, got %d", code)
	}
}
