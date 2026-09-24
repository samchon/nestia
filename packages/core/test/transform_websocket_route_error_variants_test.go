package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
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
//  2. Assert the transform fails (exit 3) for every variant.
func TestTransformWebSocketRouteErrorVariants(t *testing.T) {
	features := []string{
		"websocket-error-invalid-acceptor",
		"websocket-error-invalid-acceptor-arity",
		"websocket-error-invalid-acceptor-import",
		"websocket-error-invalid-parameter",
		"websocket-error-no-acceptor",
	}
	for _, feature := range features {
		feature := feature
		t.Run(feature, func(t *testing.T) {
			temp := t.TempDir()
			root := featureRootForCore(t, feature)
			tsconfig := writeExtendingTsconfig(t, temp, root, "", []string{
				featureSource(t, feature, "controllers/CalculateController.ts"),
			})
			code := transform.Run([]string{
				"transform",
				"--cwd", temp,
				"--tsconfig", tsconfig,
				"--file", featureSource(t, feature, "controllers/CalculateController.ts"),
				"--plugins-json", coreNativePlugins("validate", "assert"),
			})
			if code != 3 {
				t.Fatalf("%s should exit 3, got %d", feature, code)
			}
		})
	}
}
