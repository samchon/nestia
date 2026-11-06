package test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

// TestBuildEmitProvenance verifies physical source ownership at final output
// publication, including failed diagnostics and failed native writes.
//
// Compiler callbacks may stage output that a later transform rejects. Such
// bytes must never be reported as an authoritative completed runtime emit.
//
// 1. Build valid, rejected and analysis-only typed-route programs.
// 2. Assert exact script ownership and exclude declarations and source maps.
// 3. Fail native publication and private result writes without claiming success.
//
// @evidence contracts/testing.md#behavioral-verification Actual build dispatch produces script-only physical provenance for successful final writes and empty objects for rejected, discarded and blocked output. Metadata write failures change the command status.
// @evidence contracts/testing.md#independent-expectations Authored source paths and native realpath establish the only script owner, while noEmit and diagnosed rejection independently prohibit artifact publication.
// @evidence contracts/testing.md#distinguishing-cases Successful declaration/map emission, transform and semantic rejection, noEmit, blocked output, relative paths and unwritable metadata each own a distinct expected status and provenance shape.
// @evidence contracts/testing.md#execution-ownership The canonical core Go runner invokes the dispatcher in-process with temporary fixture files. It launches no compiler binary or installed application.
func TestBuildEmitProvenance(t *testing.T) {
	for _, scenario := range []string{"emit", "transform-failure", "semantic-failure", "noEmit", "write-failure", "partial-write-failure"} {
		t.Run(scenario, func(t *testing.T) {
			p := writeLlmRouteBuildProject(t, llmRouteBuildProjectOptions{Valid: scenario != "transform-failure"})
			if scenario == "semantic-failure" {
				writeFile(t, filepath.Join(p.Root, "src/main.ts"), "export const value: string = 42;")
			}
			if scenario == "write-failure" {
				writeFile(t, p.OutDir, "blocks output directory")
			}
			if scenario == "partial-write-failure" {
				writeFile(t, filepath.Join(p.Root, "src/second.ts"), "export const second = 2;")
				configPath := filepath.Join(p.Root, "tsconfig.json")
				config, err := os.ReadFile(configPath)
				if err != nil {
					t.Fatal(err)
				}
				writeFile(t, configPath, strings.Replace(string(config), `"src/main.ts"`, `"src/main.ts", "src/second.ts"`, 1))
				if err := os.MkdirAll(filepath.Join(p.OutDir, "second.js"), 0o755); err != nil {
					t.Fatal(err)
				}
			}
			resultPath := filepath.Join(p.Root, "provenance.json")
			args := []string{"build", "--cwd", p.Root, "--plugins-json", p.PluginsJSON, "--emit-provenance-json", resultPath}
			if scenario == "noEmit" {
				args = append(args, "--noEmit")
			}
			_, errors, code := runCoreNative(args)
			expectedCode := 0
			if scenario == "transform-failure" || scenario == "write-failure" || scenario == "partial-write-failure" {
				expectedCode = 3
			}
			if scenario == "semantic-failure" {
				expectedCode = 2
			}
			if code != expectedCode {
				t.Fatalf("status=%d want=%d\n%s", code, expectedCode, errors)
			}
			data, err := os.ReadFile(resultPath)
			if err != nil {
				t.Fatal(err)
			}
			var actual map[string][]string
			if err := json.Unmarshal(data, &actual); err != nil {
				t.Fatal(err)
			}
			expected := map[string][]string{}
			if scenario == "emit" || scenario == "partial-write-failure" {
				source, err := filepath.EvalSymlinks(filepath.Join(p.Root, "src/main.ts"))
				if err != nil {
					t.Fatal(err)
				}
				expected[filepath.Join(p.OutDir, "main.js")] = []string{source}
				for _, name := range []string{"main.js", "main.js.map", "main.d.ts", "main.d.ts.map"} {
					if _, err := os.Stat(filepath.Join(p.OutDir, name)); err != nil {
						t.Fatal(err)
					}
				}
			}
			if actual == nil || !reflect.DeepEqual(actual, expected) {
				t.Fatalf("provenance=%#v want=%#v", actual, expected)
			}
		})
	}
	p := writeLlmRouteBuildProject(t, llmRouteBuildProjectOptions{Valid: true})
	for _, scenario := range []struct {
		path   string
		status int
	}{{"relative.json", 2}, {p.Root, 3}} {
		_, errors, code := runCoreNative([]string{"build", "--cwd", p.Root, "--plugins-json", p.PluginsJSON, "--emit-provenance-json", scenario.path})
		if code != scenario.status {
			t.Fatalf("private channel status=%d want=%d\n%s", code, scenario.status, errors)
		}
	}
}
