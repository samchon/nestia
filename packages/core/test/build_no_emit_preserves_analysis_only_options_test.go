package test

import (
	"os"
	"strings"
	"testing"
)

// TestBuildNoEmitPreservesAnalysisOnlyOptions verifies the analysis-only
// transform traversal does not invalidate compiler options that are legal only
// in a no-emit project.
//
// `allowImportingTsExtensions` is accepted with noEmit but rejected by a normal
// emitting configuration. The transformers run on the no-emit Program itself,
// so diagnosing an emit-forced configuration to reach them would turn a valid
// analysis-only build into a false failure.
//
//  1. Create a valid no-emit TypedRoute project with the analysis-only option.
//  2. Run the native build path and require a clean exit.
//  3. Prove the analysis traversal publishes no output or build metadata.
//
// @evidence contracts/testing.md#behavioral-verification The native build dispatcher receives a valid noEmit project with allowImportingTsExtensions and must return zero with no streams, output directory, build-info or manifest.
// @evidence contracts/testing.md#independent-expectations allowImportingTsExtensions is legal in analysis-only TypeScript configurations; the analysis transform traversal must preserve that accepted configuration and publish no artifacts.
// @evidence contracts/testing.md#distinguishing-cases This is the valid analysis-only option control; tuple-schema rejection across no-emit entries belongs to TestBuildNoEmitReportsLlmRouteDiagnostic.
// @evidence contracts/testing.md#execution-ownership Go discovers the case in the core module and runCoreNative calls the dispatcher in-process with scoped stream buffers; the fixture and all possible outputs belong to t.TempDir.
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
