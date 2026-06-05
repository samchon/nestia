package test

import (
	"path/filepath"
	"strings"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestTransformTypiaPluginRewritesRandomCall verifies the typia-only plugin path
// drives nestiaTypiaNodeTransform and rewrites a `typia.random<T>()` call into a
// generator that honors the @type uint JSDoc tag (integer, not float).
//
// The transform composes a typia node transformer even when @nestia/core is
// absent; this is the seam that handles bare typia call sites (random, assert,
// etc.) in any source file. A regression that dropped the JSDoc type tags would
// emit a float generator and break uint constraints silently — the program still
// compiles. We pin the integer-generator branch by transforming a random<uint>
// fixture and asserting the integer artifacts replace the number ones.
//
//  1. Build a tsconfig including the random fixture and IPage.
//  2. Run transform with a typia-only plugin manifest, capturing --out.
//  3. Assert the integer random artifacts are present and the float one is gone.
func TestTransformTypiaPluginRewritesRandomCall(t *testing.T) {
	temp := t.TempDir()
	featureRoot := featureRootForCore(t, "app")
	fixture := featureSource(t, "app", "test/transform_random_uint_fixture.ts")
	tsconfig := writeExtendingTsconfig(t, temp, featureRoot, "", []string{
		fixture,
		featureSource(t, "app", "api/structures/IPage.ts"),
	})
	outPath := filepath.Join(temp, "out.ts")
	code := transform.Run([]string{
		"transform",
		"--cwd", temp,
		"--tsconfig", tsconfig,
		"--file", fixture,
		"--out", outPath,
		"--plugins-json", `[{"name":"typia","stage":"transform","config":{"transform":"typia/lib/transform"}}]`,
	})
	if code != 0 {
		t.Fatalf("typia transform exited %d", code)
	}
	out := mustReadFile(t, outPath)
	mustContainAll(t, out, "_randomInteger", `type: "integer"`, "minimum: 0")
	if strings.Contains(out, "_randomNumber") {
		t.Fatalf("uint random must use integer constraints\n%s", out)
	}
}
