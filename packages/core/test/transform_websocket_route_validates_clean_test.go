package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestTransformWebSocketRouteValidatesClean verifies the core transform accepts
// a well-formed @WebSocketRoute controller, exercising the WebSocket route
// validator (acceptor / header / driver / query / param category checks) on the
// success path.
//
// validateNestiaCoreWebSocketRoute runs inside the AST emit transform for every
// @WebSocketRoute method; the error variants (invalid driver, missing acceptor)
// are pinned elsewhere, but the all-categories-present success branch is only
// reached by a valid controller. A regression that miscategorized a parameter
// would either emit a spurious diagnostic (nonzero exit) or skip validation. We
// transform the websocket feature in project mode and assert a clean exit 0.
//
//  1. Run transform in project mode against the websocket feature tsconfig.
//  2. Assert the exit code is 0 (no WebSocket validation diagnostics).
//
// @evidence contracts/testing.md#behavioral-verification The ordinary WebSocket program must transform in project mode with exit 0, detecting rejection of supported acceptor/provider/listener declarations.
// @evidence contracts/testing.md#independent-expectations The authored WebSocket controller follows the supported route and acceptor contract, independently of generated transform output.
// @evidence contracts/testing.md#distinguishing-cases This owns ordinary project acceptance; type-alias/destructured tests own alternate bindings and invalid-driver/acceptor tests own rejected neighbors.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit function and executes the native dispatcher in the test process against real fixture source. Temporary configuration/output files belong to t.TempDir; no consumer installation or native host process is started.
func TestTransformWebSocketRouteValidatesClean(t *testing.T) {
	cwd := featureRootForCore(t, "websocket")
	code := transform.Run([]string{
		"transform",
		"--cwd", cwd,
		"--tsconfig", "tsconfig.json",
		"--plugins-json", coreNativePlugins("validate", "assert"),
	})
	if code != 0 {
		t.Fatalf("clean websocket feature should transform with exit 0, got %d", code)
	}
}
