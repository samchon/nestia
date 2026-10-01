package test

import (
	"path/filepath"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestTransformOutWithoutFileAndMissingFile verifies the two post-load guards in
// runTransform: --out is rejected when no --file is given, and a --file that is
// not part of the loaded program is reported as a usage error.
//
// Both checks run after LoadProgram succeeds, so they can only be reached with a
// valid feature tsconfig; a malformed-config test would short-circuit earlier
// and never exercise them. They protect the single-file output contract — --out
// is meaningless project-wide, and an off-program --file would otherwise silently
// emit nothing. Each is pinned with exit code 2.
//
//  1. With a loadable program, pass --out but no --file -> exit 2.
//  2. With the same program, pass a --file outside the program -> exit 2.
//
// @evidence contracts/testing.md#behavioral-verification A loadable program rejects --out without --file and rejects an off-program file with exit 2, rather than reporting an empty successful transform.
// @evidence contracts/testing.md#independent-expectations A single output file requires a single selected source, and an absent source cannot be selected from the loaded program; both violate the supported command shape.
// @evidence contracts/testing.md#distinguishing-cases Missing selection and nonexistent selection are separate negatives after valid configuration load; successful selected-source output is covered by the single-file stdout and output tests.
// @evidence contracts/testing.md#execution-ownership Go discovers the core unit function and calls Run directly twice against the body program; no native executable is built and the candidate output belongs to t.TempDir.
func TestTransformOutWithoutFileAndMissingFile(t *testing.T) {
	cwd := featureRootForCore(t, "body")
	plugins := coreNativePlugins("validate", "assert")

	if code := transform.Run([]string{
		"transform",
		"--cwd", cwd,
		"--tsconfig", "tsconfig.json",
		"--out", filepath.Join(t.TempDir(), "out.ts"),
		"--plugins-json", plugins,
	}); code != 2 {
		t.Fatalf("--out without --file should exit 2, got %d", code)
	}

	if code := transform.Run([]string{
		"transform",
		"--cwd", cwd,
		"--tsconfig", "tsconfig.json",
		"--file", filepath.Join(cwd, "src/controllers/DoesNotExist.ts"),
		"--plugins-json", plugins,
	}); code != 2 {
		t.Fatalf("off-program --file should exit 2, got %d", code)
	}
}
