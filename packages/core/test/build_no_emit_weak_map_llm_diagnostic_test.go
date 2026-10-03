package test

import (
	"os"
	"path/filepath"
	"testing"
)

// TestBuildNoEmitWeakMapLlmDiagnostic verifies analysis-only builds retain
// the unsupported response diagnostic without publishing compiler artifacts.
//
// WeakMap rejection must survive all analysis-only entry routes, rather than
// becoming an ordinary successful type check when emission is disabled. The
// same controller with a string property is its valid one-axis control.
//
//  1. Author equivalent WeakMap and string response controllers.
//  2. Run check, explicit noEmit and configuration-owned noEmit in-process.
//  3. Require the source/type diagnostic or success, and no artifacts in either.
//
// @evidence contracts/testing.md#behavioral-verification Each analysis-only native build rejects the authored WeakMap response with transform exit3, its own source location, TypedRoute diagnostic code and LLM schema reason. The otherwise identical string response succeeds. Neither result may publish output, build info or the manifest.
// @evidence contracts/testing.md#independent-expectations WeakMap is unsupported by the LLM schema contract whereas a string property is supported. Authored source fixes the property and decorator location; literal diagnostic and no-publication expectations are independent of the operation's output.
// @evidence contracts/testing.md#distinguishing-cases WeakMap/string twins execute check, explicit noEmit and configured noEmit. TestBuildNoEmitReportsLlmRouteDiagnostic separately isolates LLM-only tuple rejection from JSON serialization, while TestSourceTransformLlmStrictDiagnosticCases owns strict/non-strict body/query and response decisions. This case preserves the former transform-options WeakMap noEmit rejection without claiming a separate installed JS wrapper invocation.
// @evidence contracts/testing.md#execution-ownership The core Go module discovers this matching Test and its six named controls. Native build/check operations execute in-process on t.TempDir language inputs; no plugin executable, installation, Node child or HTTP application is prepared.
func TestBuildNoEmitWeakMapLlmDiagnostic(t *testing.T) {
	for _, entry := range []struct {
		name, command string
		configured    bool
		explicit      bool
	}{
		{"check", "check", false, false},
		{"explicit-no-emit", "build", false, true},
		{"configured-no-emit", "build", true, false},
	} {
		for _, witness := range []struct {
			name, property, value string
			failure               bool
		}{
			{"weak-map", "WeakMap<object, object>", "new WeakMap()", true},
			{"string", "string", `"value"`, false},
		} {
			t.Run(entry.name+"/"+witness.name, func(t *testing.T) {
				project := writeLlmRouteBuildProject(t, llmRouteBuildProjectOptions{NoEmit: entry.configured, Valid: true})
				writeFile(t, filepath.Join(project.Root, "src/main.ts"), `import { TypedRoute } from "@nestia/core";

interface IArticle {
  weak: `+witness.property+`;
}

export class Controller {
  @TypedRoute.Get()
  public get(): IArticle { return { weak: `+witness.value+` }; }
}
`)
				args := []string{entry.command, "--cwd", project.Root, "--tsconfig", "tsconfig.json", "--manifest", project.Manifest, "--plugins-json", project.PluginsJSON}
				if entry.explicit {
					args = append(args, "--noEmit")
				}
				stdout, stderr, code := runCoreNative(args)
				if witness.failure {
					if code != 3 {
						t.Fatalf("WeakMap analysis should return transform exit3, got %d\n%s\n%s", code, stdout, stderr)
					}
					mustContainAll(t, filepath.ToSlash(stderr),
						"src/main.ts:8:4 - error TS(nestia.core.TypedRoute): unsupported type detected",
						"- IArticle.weak: WeakMap",
						"- LLM schema does not support WeakMap type.")
				} else if code != 0 {
					t.Fatalf("string response analysis failed (%d)\n%s\n%s", code, stdout, stderr)
				}
				for _, artifact := range []string{project.OutDir, project.BuildInfo, project.Manifest} {
					if _, err := os.Stat(artifact); !os.IsNotExist(err) {
						t.Fatalf("analysis published an artifact or its absence is unknown: %s: %v", artifact, err)
					}
				}
			})
		}
	}
}
