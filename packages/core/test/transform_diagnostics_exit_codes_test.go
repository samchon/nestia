package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestTransformDiagnosticsExitCodes verifies the in-process transform reports
// its two diagnostic classes with distinct exit codes: a tsgo config/type error
// surfaces before the transform runs as exit 2, while a nestia transform-stage
// diagnostic (invalid WebSocket driver) surfaces as exit 3.
//
// The exit code is the protocol ttsc keys on: 2 means "the program didn't even
// compile", 3 means "nestia rejected a decorator". strictNullChecks-off trips
// typia's hard precondition during the transform (exit 3 path via the global
// diagnostic), and an invalid Driver<Listener> trips the WebSocket validator's
// transform diagnostic. Driving both in-process pins the WriteTypiaTransform
// Diagnostics emit branch and nestiaCoreWebSocketDiagnostic together.
//
//  1. Transform the query feature with strictNullChecks off -> nonzero exit.
//  2. Transform the invalid-driver websocket feature -> exit 3.
func TestTransformDiagnosticsExitCodes(t *testing.T) {
	plugins := coreNativePlugins("validate", "assert")

	strictTemp := t.TempDir()
	queryRoot := featureRootForCore(t, "query")
	strictTsconfig := writeExtendingTsconfig(t, strictTemp, queryRoot, `,
    "strictNullChecks": false`, []string{
		featureSource(t, "query", "controllers/QueryController.ts"),
		featureSource(t, "query", "api/structures/IBigQuery.ts"),
		featureSource(t, "query", "api/structures/INestQuery.ts"),
		featureSource(t, "query", "api/structures/IQuery.ts"),
	})
	if code := transform.Run([]string{
		"transform",
		"--cwd", strictTemp,
		"--tsconfig", strictTsconfig,
		"--file", featureSource(t, "query", "controllers/QueryController.ts"),
		"--plugins-json", plugins,
	}); code == 0 {
		t.Fatal("strictNullChecks off should fail the transform")
	}

	wsTemp := t.TempDir()
	wsRoot := featureRootForCore(t, "websocket-error-invalid-driver")
	wsTsconfig := writeExtendingTsconfig(t, wsTemp, wsRoot, "", []string{
		featureSource(t, "websocket-error-invalid-driver", "controllers/CalculateController.ts"),
	})
	if code := transform.Run([]string{
		"transform",
		"--cwd", wsTemp,
		"--tsconfig", wsTsconfig,
		"--file", featureSource(t, "websocket-error-invalid-driver", "controllers/CalculateController.ts"),
		"--plugins-json", plugins,
	}); code != 3 {
		t.Fatalf("invalid WebSocket driver should exit 3, got %d", code)
	}
}
