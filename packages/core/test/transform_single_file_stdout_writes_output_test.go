package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestTransformSingleFileStdoutWritesOutput verifies the single-file transform
// path with no --out writes the rewritten TypeScript to stdout and exits 0.
//
// writeSingleOutput has two arms: the --out arm (covered by every helper-based
// test) and the stdout arm taken when --out is empty. ttsc invokes the binary
// without --out and reads the rewrite off stdout, so the stdout arm is the
// production path; only an explicit no--out call exercises it. The emitted text
// lands on the process stdout (the test log), not the source tree, so nothing is
// polluted. A regression that swapped the arms would make ttsc read an empty
// pipe and silently skip the transform.
//
//  1. Transform the body feature's TypedBodyController with no --out.
//  2. Assert the exit code is 0 (output written to stdout, not a file).
func TestTransformSingleFileStdoutWritesOutput(t *testing.T) {
	cwd := featureRootForCore(t, "body")
	code := transform.Run([]string{
		"transform",
		"--cwd", cwd,
		"--tsconfig", "tsconfig.json",
		"--file", featureSource(t, "body", "controllers/TypedBodyController.ts"),
		"--plugins-json", coreNativePlugins("assert", "assert"),
	})
	if code != 0 {
		t.Fatalf("single-file transform to stdout should exit 0, got %d", code)
	}
}
