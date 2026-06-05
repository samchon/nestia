package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestTransformProjectModeReportsDiagnostics verifies that project-mode
// transform (no --file) converts a nestia transform diagnostic into the JSON
// compiler-diagnostic envelope and exits 3.
//
// The single-file path writes diagnostics to stderr and exits, but project mode
// takes a different seam: it accumulates transformDiagnosticToCompilerDiagnostic
// entries into the JSON output and returns 3 only when that slice is non-empty.
// Those conversion helpers (newTransformCompilerDiagnostic,
// transformDiagnosticToCompilerDiagnostic) are otherwise unreachable. The run
// MUST use the feature's own cwd and tsconfig: project mode keys each emitted
// file by its path relative to cwd and skips any file whose key escapes cwd with
// "../", so pointing cwd at a temp dir outside the feature would silently emit
// an empty program and exit 0, hiding the diagnostic. Output is the in-memory
// JSON map written to stdout, so nothing is written to the source tree.
//
//  1. Run project-mode transform over the invalid-driver websocket feature using
//     its own tsconfig so its sources resolve under cwd.
//  2. Assert the exit code is 3 (diagnostics encoded into the project output).
func TestTransformProjectModeReportsDiagnostics(t *testing.T) {
	root := featureRootForCore(t, "websocket-error-invalid-driver")
	code := transform.Run([]string{
		"transform",
		"--cwd", root,
		"--tsconfig", "tsconfig.json",
		"--plugins-json", coreNativePlugins("validate", "assert"),
	})
	if code != 3 {
		t.Fatalf("project mode with a transform diagnostic should exit 3, got %d", code)
	}
}
