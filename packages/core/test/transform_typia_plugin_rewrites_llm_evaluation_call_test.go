package test

import (
	"path/filepath"
	"strings"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestTransformTypiaPluginRewritesLlmEvaluationCall verifies the typia linked
// into the nestia host rewrites `typia.llm.evaluation<T>()`, an API typia 15
// introduced, into the evaluation object instead of leaving the call in place.
//
// The host links the typia the Go modules pin, not the typia npm installs.
// When the pin lagged a major behind npm (#1646), this call type-checked
// against typia 15's declarations but reached the runtime untransformed, where
// typia's stub throws "no transform has been configured". An untouched call is
// exactly what the runtime stub needs to throw, so asserting the call is gone
// and the generated question is present pins the linked version from the
// output side; TestTypiaGoPinMatchesNpmTypia pins it from the module side.
//
//  1. Build a tsconfig including the llm evaluation fixture.
//  2. Run transform with a typia-only plugin manifest, capturing --out.
//  3. Assert the evaluation call is replaced by typia's evaluation factory,
//     given one boolean question built from the property's JSDoc description.
func TestTransformTypiaPluginRewritesLlmEvaluationCall(t *testing.T) {
	temp := t.TempDir()
	featureRoot := featureRootForCore(t, "app")
	fixture := featureSource(t, "app", "test/transform_llm_evaluation_fixture.ts")
	tsconfig := writeExtendingTsconfig(t, temp, featureRoot, "", []string{fixture})
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
	if strings.Contains(out, "llm.evaluation<") {
		t.Fatalf("typia.llm.evaluation<T>() was left untransformed\n%s", out)
	}
	mustContainAll(t, out, "_createLlmEvaluation(", `instructions: "Whether the reply answers the question."`, `kind: "boolean"`)
}
