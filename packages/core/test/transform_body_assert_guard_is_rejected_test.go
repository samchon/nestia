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
//
// @evidence contracts/testing.md#behavioral-verification An assertGuard validate option must produce exit 3 and the exact invalid-option diagnostic rather than silently generating a fallback validator.
// @evidence contracts/testing.md#independent-expectations assertGuard is not a supported nestia validate mode; the invalid-option wording and transform diagnostic exit identify option rejection rather than an unrelated failure.
// @evidence contracts/testing.md#distinguishing-cases This pins the unsupported typia-only spelling; the plugin-option table includes supported modes, a near typo, a wrong primitive type and invalid stringify, and runtime modes own accepted values.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
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
