package test

import (
	"path/filepath"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestTransformMissingTsconfigReportsLoadError verifies that pointing transform
// at a nonexistent tsconfig surfaces the LoadProgram failure as exit 2 rather
// than panicking or emitting partial output.
//
// LoadProgram is the first heavy step after argument parsing; its error return
// is the common failure mode for a misconfigured workspace. The guard converts
// the Go error into the usage exit code ttsc expects. A regression that ignored
// the error would proceed to dereference a nil program. We pin it with a cwd
// that has no tsconfig at the requested path.
//
//  1. Run transform with --tsconfig pointing at a file that does not exist.
//  2. Assert the exit code is 2.
func TestTransformMissingTsconfigReportsLoadError(t *testing.T) {
	temp := t.TempDir()
	code := transform.Run([]string{
		"transform",
		"--cwd", temp,
		"--tsconfig", filepath.Join(temp, "nope.json"),
		"--file", filepath.Join(temp, "X.ts"),
		"--plugins-json", coreNativePlugins("validate", "assert"),
	})
	if code != 2 {
		t.Fatalf("missing tsconfig should exit 2, got %d", code)
	}
}
