package test

import (
	"os"
	"strings"
	"testing"
)

// TestBuildTransformDiagnosticPublishesNoArtifacts verifies an emitting build
// cannot leave runnable, untransformed JavaScript after a transform rejection.
//
// The emitter discovers decorator diagnostics while generating JavaScript. It
// previously wrote declarations and JavaScript before checking that diagnostic
// collection, so a caller that ignored exit code 3 could execute a bare
// TypedRoute decorator and receive NoTransformConfigurationError at runtime.
//
//  1. Build a tuple-return TypedRoute project with LLM validation enabled.
//  2. Require the transform exit code and exact LLM diagnostic.
//  3. Assert no output, build-info, or manifest artifact was published.
func TestBuildTransformDiagnosticPublishesNoArtifacts(t *testing.T) {
	project := writeLlmRouteBuildProject(t, llmRouteBuildProjectOptions{})
	out, errText, code := runCoreNative([]string{
		"build",
		"--cwd", project.Root,
		"--tsconfig", "tsconfig.json",
		"--manifest", project.Manifest,
		"--plugins-json", project.PluginsJSON,
	})
	if code != 3 {
		t.Fatalf("invalid emitting build should fail with code 3, got %d\nstdout=%s\nstderr=%s", code, out, errText)
	}
	mustContainAll(t, errText,
		"error TS(nestia.core.TypedRoute): unsupported type detected",
		"- IResponse.pair: [string, number]",
		"- LLM schema does not support tuple type.",
	)
	if strings.TrimSpace(out) != "" {
		t.Fatalf("quiet failed build wrote stdout:\n%s", out)
	}
	for _, path := range []string{project.OutDir, project.BuildInfo, project.Manifest} {
		if _, err := os.Stat(path); !os.IsNotExist(err) {
			t.Fatalf("failed build published %s: %v", path, err)
		}
	}
}
