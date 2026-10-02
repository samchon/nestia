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
//
// @evidence contracts/testing.md#behavioral-verification An emitting build with an LLM-invalid tuple must return exit 3 and its precise reason while leaving JavaScript, declarations, build-info and manifest unpublished.
// @evidence contracts/testing.md#independent-expectations The tuple response is JSON-valid but violates the enabled LLM schema contract; a rejected producer must not publish apparently runnable partial output.
// @evidence contracts/testing.md#distinguishing-cases This case owns failed emitting publication; the sibling no-emit table owns analysis-only entries, and successful build behavior remains in normal transform fixtures.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this case and calls its dispatcher through runCoreNative in-process; t.TempDir owns every candidate artifact and no installed consumer is launched.
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
