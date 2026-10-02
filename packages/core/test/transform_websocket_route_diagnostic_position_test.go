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
//
// @evidence contracts/testing.md#behavioral-verification A missing-acceptor transform must return exit 3 and identify CalculateController.ts:9:3, detecting a diagnostic attached to the wrong node or wrong failure class.
// @evidence contracts/testing.md#independent-expectations The authored method begins at line 9 column 3 and lacks the required acceptor; method-level diagnostics should identify that declaration.
// @evidence contracts/testing.md#distinguishing-cases This owns missing-acceptor position; the variant table owns additional invalid parameter/type shapes and valid WebSocket cases own acceptance.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit function and executes the native dispatcher in the test process against real fixture source. Temporary configuration/output files belong to t.TempDir; no consumer installation or native host process is started.
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
