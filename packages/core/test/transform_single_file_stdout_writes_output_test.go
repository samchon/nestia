package test

import "testing"

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
//
// @evidence contracts/testing.md#behavioral-verification Single-file transformation without --out must return exit 0 and write a TypedBody object with an assert discriminator to stdout, detecting silent success without emitted transformation.
// @evidence contracts/testing.md#independent-expectations The selected TypedBodyController requires an assert validator and the single-file protocol publishes its rewritten TypeScript on stdout when no output file is named.
// @evidence contracts/testing.md#distinguishing-cases This owns the stdout route; transformFileToString-based cases own --out artifacts and missing-file/output-option cases own invalid selection.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit function and executes the native dispatcher in the test process against real fixture source. Temporary configuration/output files belong to t.TempDir; no consumer installation or native host process is started.
func TestTransformSingleFileStdoutWritesOutput(t *testing.T) {
	cwd := featureRootForCore(t, "body")
	stdout, stderr, code := runCoreNative([]string{
		"transform",
		"--cwd", cwd,
		"--tsconfig", "tsconfig.json",
		"--file", featureSource(t, "body", "controllers/TypedBodyController.ts"),
		"--plugins-json", coreNativePlugins("assert", "assert"),
	})
	if code != 0 {
		t.Fatalf("single-file transform to stdout should exit 0, got %d:\n%s", code, stderr)
	}
	mustDecorateAll(t, stdout, `@core\.TypedBody`, "assert")
}
