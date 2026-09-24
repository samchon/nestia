package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestTransformWebSocketRouteTypeAlias verifies the WebSocket route validator
// accepts every spelling of tgrid's acceptor and driver types.
//
// The validator compared the text of an @WebSocketRoute.Acceptor() or .Driver()
// annotation with `WebSocketAcceptor` and `Driver`, so a renamed import such as
// `Acceptor<...>` and every type alias failed the build although the type was
// exactly tgrid's (#1671). The websocket-type-alias fixture spells both through
// a renamed import, a local alias, an imported alias, a generic alias with and
// without its default, an alias of a generic alias, and import types of tgrid's
// types and of a generic alias, which the text comparison had accepted.
//
//  1. Transform the fixture's controller.
//  2. Assert the transform exits 0, reporting no WebSocket diagnostic.
func TestTransformWebSocketRouteTypeAlias(t *testing.T) {
	const feature = "websocket-type-alias"
	temp := t.TempDir()
	controller := featureSource(t, feature, "controllers/AliasSocketController.ts")
	tsconfig := writeExtendingTsconfig(t, temp, featureRootForCore(t, feature), "", []string{controller})
	code := transform.Run([]string{
		"transform",
		"--cwd", temp,
		"--tsconfig", tsconfig,
		"--file", controller,
		"--plugins-json", coreNativePlugins("validate", "assert"),
	})
	if code != 0 {
		t.Fatalf("%s should transform with exit 0, got %d", feature, code)
	}
}
