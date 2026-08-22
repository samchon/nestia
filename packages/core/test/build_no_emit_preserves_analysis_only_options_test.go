package test

import (
	"os"
	"strings"
	"testing"
)

// TestBuildNoEmitPreservesAnalysisOnlyOptions verifies the private transform
// traversal does not invalidate compiler options that are legal only in a
// no-emit project.
//
// `allowImportingTsExtensions` is accepted with noEmit but rejected by a normal
// emitting configuration. The private ForceEmit program exists only to invoke
// transformers, so repeating TypeScript diagnostics against that overridden
// configuration would turn a valid analysis-only build into a false failure.
//
//  1. Create a valid no-emit TypedRoute project with the analysis-only option.
//  2. Run the native build path and require a clean exit.
//  3. Prove the private traversal publishes no output or build metadata.
func TestBuildNoEmitPreservesAnalysisOnlyOptions(t *testing.T) {
	project := writeLlmRouteBuildProject(t, llmRouteBuildProjectOptions{
		NoEmit:                     true,
		AllowImportingTsExtensions: true,
		Valid:                      true,
	})
	out, errText, code := runCoreNative([]string{
		"build",
		"--cwd", project.Root,
		"--tsconfig", "tsconfig.json",
		"--manifest", project.Manifest,
		"--plugins-json", project.PluginsJSON,
	})
	if code != 0 {
		t.Fatalf("valid analysis-only project failed with code %d\nstdout=%s\nstderr=%s", code, out, errText)
	}
	if strings.TrimSpace(out) != "" || strings.TrimSpace(errText) != "" {
		t.Fatalf("quiet analysis-only build wrote output:\nstdout=%s\nstderr=%s", out, errText)
	}
	for _, path := range []string{project.OutDir, project.BuildInfo, project.Manifest} {
		if _, err := os.Stat(path); !os.IsNotExist(err) {
			t.Fatalf("analysis-only traversal published %s: %v", path, err)
		}
	}
}
