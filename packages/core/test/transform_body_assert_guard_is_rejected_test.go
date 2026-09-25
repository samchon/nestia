package test

import (
	"strings"
	"testing"
)

// TestTransformBodyAssertGuardIsRejected verifies a validate mode nestia does
// not offer, here typia's "assertGuard", fails the build by name instead of
// falling to @TypedBody's default validator.
//
// This test once pinned that fallback: every unrecognized value generated a
// `validate` validator, so a typo silently weakened validation (#1727).
//
//  1. Transform the body controller with validate "assertGuard".
//  2. Assert it exits 3 with the invalid-option diagnostic.
func TestTransformBodyAssertGuardIsRejected(t *testing.T) {
	const feature = "body"
	temp := t.TempDir()
	root := featureRootForCore(t, feature)
	controller := featureSource(t, feature, "controllers/TypedBodyController.ts")
	tsconfig := writeExtendingTsconfig(t, temp, root, "", []string{controller})
	_, stderr, code := runCoreNative([]string{
		"transform",
		"--cwd", temp,
		"--tsconfig", tsconfig,
		"--file", controller,
		"--plugins-json", coreNativePlugins("assertGuard", "assert"),
	})
	if code != 3 || strings.Contains(stderr, `invalid "validate" option "assertGuard"`) == false {
		t.Fatalf("assertGuard should be rejected, got %d:\n%s", code, stderr)
	}
}
