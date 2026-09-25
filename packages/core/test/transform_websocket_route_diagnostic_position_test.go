package test

import (
	"strings"
	"testing"
)

// TestTransformWebSocketRouteDiagnosticPosition verifies a WebSocket route
// diagnostic points at the method it names.
//
// The position came from the method node's Pos(), its full start, which is the
// end of the previous line, so a method at line 9 was reported at 8:35, the
// end of the class line (#1725).
//
//  1. Transform the websocket-error-no-acceptor controller, whose method's
//     decorator opens line 9 at column 3.
//  2. Assert the missing-acceptor diagnostic is reported at 9:3.
func TestTransformWebSocketRouteDiagnosticPosition(t *testing.T) {
	const feature = "websocket-error-no-acceptor"
	temp := t.TempDir()
	root := featureRootForCore(t, feature)
	controller := featureSource(t, feature, "controllers/CalculateController.ts")
	tsconfig := writeExtendingTsconfig(t, temp, root, "", []string{controller})
	_, stderr, code := runCoreNative([]string{
		"transform",
		"--cwd", temp,
		"--tsconfig", tsconfig,
		"--file", controller,
		"--plugins-json", coreNativePlugins("validate", "assert"),
	})
	if code != 3 {
		t.Fatalf("expected exit 3, got %d:\n%s", code, stderr)
	}
	if strings.Contains(stderr, "CalculateController.ts:9:3") == false {
		t.Fatalf("the missing-acceptor diagnostic is not reported at the method's 9:3:\n%s", stderr)
	}
}
