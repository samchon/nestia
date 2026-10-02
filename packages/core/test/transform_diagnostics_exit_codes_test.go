package test

import (
	"strings"
	"testing"
)

// TestTransformDiagnosticsExitCodes verifies a nestia transform-stage
// diagnostic (an invalid WebSocket driver) of the single-file transform surfaces
// as exit 3 with its diagnostic text.
//
// Exit 3 is the code ttsc keys on for "nestia rejected a decorator", distinct
// from a usage error (2) and from success. The strictNullChecks precondition has
// its own table in TestTransformStrictModeRequired, and the project-mode path in
// TestTransformProjectModeReportsDiagnostics, so this case owns the single-file
// path of the driver diagnostic.
//
//  1. Transform the invalid-driver websocket feature's controller with --file.
//  2. Assert exit 3 and a WebSocketRoute diagnostic on stderr.
//
// @evidence contracts/testing.md#behavioral-verification The invalid WebSocket-driver fixture transformed with --file must fail with transform exit 3 and a nestia.core.WebSocketRoute diagnostic on stderr, so a loader failure or a silent success cannot stand in for it.
// @evidence contracts/testing.md#independent-expectations A WebSocket route requires its supported driver type; the literal exit 3 and the diagnostic code separate a rejected decorator from success and from a usage error.
// @evidence contracts/testing.md#distinguishing-cases This owns the single-file driver diagnostic. The strict null precondition is pinned with exit 3 and wording by the strict-mode table, project mode by its own case, and accepted forms by the clean WebSocket cases.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit case; the dispatch loads fixture source in the existing process with isolated configuration and no native subprocess.
func TestTransformDiagnosticsExitCodes(t *testing.T) {
	feature := "websocket-error-invalid-driver"
	temp := t.TempDir()
	controller := featureSource(t, feature, "controllers/CalculateController.ts")
	tsconfig := writeExtendingTsconfig(t, temp, featureRootForCore(t, feature), "", []string{controller})
	_, stderr, code := runCoreNative([]string{
		"transform",
		"--cwd", temp,
		"--tsconfig", tsconfig,
		"--file", controller,
		"--plugins-json", coreNativePlugins("validate", "assert"),
	})
	if code != 3 || !strings.Contains(stderr, "error TS(nestia.core.WebSocketRoute)") {
		t.Fatalf("invalid WebSocket driver should exit 3 with a WebSocketRoute diagnostic, got %d:\n%s", code, stderr)
	}
}
