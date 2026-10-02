package test

import (
	"strings"
	"testing"
)

// TestTransformWebSocketRouteErrorVariants verifies the WebSocket route
// validator rejects each malformed acceptor / parameter shape, exercising the
// remaining diagnostic branches of validateNestiaCoreWebSocketRoute and
// nestiaCoreWebSocketParameterCategory.
//
// The clean-controller test pins the success branch; these error fixtures pin
// the failure categories — an invalid acceptor type, a locally declared type
// named WebSocketAcceptor, referenced by name or by an import type, an
// unrecognized parameter decorator, and a missing acceptor. The acceptor is
// recognized by its type, not its spelling (#1671), so a type that only shares
// tgrid's name must still be rejected, however it is referenced. Each must
// surface as a transform diagnostic (exit 3), not silently pass. Running every
// fixture in one table keeps the per-category branches covered without
// near-identical files.
//
//  1. For each websocket-error fixture, transform its CalculateController.
//  2. Assert the transform fails (exit 3) with the WebSocketRoute diagnostic that
//     names the violated rule for every variant.
//
// @evidence contracts/testing.md#behavioral-verification Each of five named invalid WebSocket fixtures must return exit 3 with the WebSocketRoute diagnostic naming its violated rule in its own subtest, preventing silent acceptance, substitution of a loader error, or one failure standing in for another.
// @evidence contracts/testing.md#independent-expectations The fixtures violate the required acceptor identity/arity/import or route parameter contract; transform rejection is distinct from invalid project loading.
// @evidence contracts/testing.md#distinguishing-cases Separate feature-named subtests retain all five failure identities. The message literals follow the diagnostics the validator documents for an acceptor type, an undecorated parameter and a missing acceptor; valid/type-alias/destructured cases own accepted forms.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit function and executes the native dispatcher in the test process against real fixture source. Temporary configuration/output files belong to t.TempDir; no consumer installation or native host process is started.
func TestTransformWebSocketRouteErrorVariants(t *testing.T) {
	features := []struct{ name, message string }{
		{"websocket-error-invalid-acceptor", `parameter "acceptor" must have WebSocketAcceptor<Header, Provider, Listener> type.`},
		{"websocket-error-invalid-acceptor-arity", `parameter "acceptor" must have WebSocketAcceptor<Header, Provider, Listener> type.`},
		{"websocket-error-invalid-acceptor-import", `parameter "acceptor" must have WebSocketAcceptor<Header, Provider, Listener> type.`},
		{"websocket-error-invalid-parameter", `parameter "precision" is not decorated with nested function of WebSocketRoute module.`},
		{"websocket-error-no-acceptor", `method "connect" must have at least one parameter decorated by @WebSocketRoute.Acceptor().`},
	}
	for _, item := range features {
		feature, message := item.name, item.message
		t.Run(feature, func(t *testing.T) {
			temp := t.TempDir()
			root := featureRootForCore(t, feature)
			tsconfig := writeExtendingTsconfig(t, temp, root, "", []string{
				featureSource(t, feature, "controllers/CalculateController.ts"),
			})
			_, stderr, code := runCoreNative([]string{
				"transform",
				"--cwd", temp,
				"--tsconfig", tsconfig,
				"--file", featureSource(t, feature, "controllers/CalculateController.ts"),
				"--plugins-json", coreNativePlugins("validate", "assert"),
			})
			if code != 3 || !strings.Contains(stderr, "error TS(nestia.core.WebSocketRoute): "+message) {
				t.Fatalf("%s should exit 3 with %q, got %d:\n%s", feature, message, code, stderr)
			}
		})
	}
}
