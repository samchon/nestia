package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestTransformWebSocketRouteDestructuredParameter verifies the core
// transform validates a WebSocket route whose handler destructures a
// parameter, instead of crashing on it.
//
// The WebSocket route validator names every parameter for its diagnostics
// before it checks the parameter's decorator. It read the name with
// typescript-go's `Text()`, which panics on a destructuring pattern, so a
// valid `@WebSocketRoute.Query() { keyword }: ISearch` crashed every build of
// the controller, not only SDK generation (#1660). A name that is no
// identifier now reads as its source text.
//
//  1. Transform the destructured-parameter feature's WebSocket controller.
//  2. Assert the transform succeeds.
//
// @evidence contracts/testing.md#behavioral-verification The native transform must accept the destructured WebSocket acceptor parameter fixture with exit 0 instead of treating its binding pattern as an invalid identifier.
// @evidence contracts/testing.md#independent-expectations TypeScript permits destructuring a correctly typed parameter; route validation concerns its acceptor type rather than the binding spelling.
// @evidence contracts/testing.md#distinguishing-cases This owns destructured-binding acceptance only; invalid acceptor variants own rejection, and the SDK destructured-parameters feature owns generated client transport.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit function and executes the native dispatcher in the test process against real fixture source. Temporary configuration/output files belong to t.TempDir; no consumer installation or native host process is started.
func TestTransformWebSocketRouteDestructuredParameter(t *testing.T) {
	const feature = "sdk-destructured-parameters"
	source := featureSource(t, feature, "controllers/DestructuredSocketController.ts")
	temp := t.TempDir()
	tsconfig := writeExtendingTsconfig(t, temp, featureRootForCore(t, feature), "", []string{source})
	code := transform.Run([]string{
		"transform",
		"--cwd", temp,
		"--tsconfig", tsconfig,
		"--file", source,
		"--plugins-json", coreNativePlugins("validate", "assert"),
	})
	if code != 0 {
		t.Fatalf("transform of %s exited %d", source, code)
	}
}
