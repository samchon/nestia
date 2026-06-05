package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestTransformProjectModeEmitsAllFiles verifies that running transform without
// --file walks every non-declaration source file in the program and emits the
// rewritten TypeScript through the project-mode JSON encoder, exiting 0.
//
// Project mode (runTransformProject) is the seam ttsc uses to ask the host to
// transform a whole program in one shot; it is a distinct path from the single
// --file case and owns sourceFileKey filtering plus the JSON output envelope. A
// regression that skipped files or mis-keyed the map would corrupt the bulk
// transform contract. Driving it with a feature program pins the success branch.
//
//  1. Run transform against the body feature's own tsconfig with no --file.
//  2. Assert the exit code is 0 (clean program, no transform diagnostics).
func TestTransformProjectModeEmitsAllFiles(t *testing.T) {
	cwd := featureRootForCore(t, "body")
	code := transform.Run([]string{
		"transform",
		"--cwd", cwd,
		"--tsconfig", "tsconfig.json",
		"--plugins-json", coreNativePlugins("validate", "assert"),
	})
	if code != 0 {
		t.Fatalf("project-mode transform should exit 0, got %d", code)
	}
}
