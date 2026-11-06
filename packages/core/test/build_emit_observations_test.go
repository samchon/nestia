package test

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"

	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// TestBuildEmitObservations verifies aggregate generation inputs and optional
// private result failures without replacing ordinary compiler diagnostics.
//
// Type-only declarations and authored config ancestors affect generated runtime
// validators even though they need not produce JavaScript of their own.
//
// 1. Build a typed route through a private wrapper over an authored config chain.
// 2. Verify input hashes, physical identities and transformed output bytes.
// 3. Compare a plain build and distinguish failed loads and private writes.
//
// @evidence contracts/testing.md#behavioral-verification The in-process build dispatcher publishes actual source/type/config/package proof and transformed route output. Ordinary emission must produce identical bytes; loaded diagnostics preserve their graph, while missing generations explicitly deny completeness and private-channel errors fail.
// @evidence contracts/testing.md#independent-expectations Authored source bytes determine SHA-256, the import and extends statements determine required graph members, and native realpath determines physical identity independently of the returned metadata.
// @evidence contracts/testing.md#distinguishing-cases Wrapper/plain success, type-only and ambient dependencies, semantic/transform failure, missing config, malformed payload and relative/unwritable result destinations exercise separate branches. Provenance publication has its own test.
// @evidence contracts/testing.md#execution-ownership The canonical core Go population discovers this function and calls RunWithOutput in-process against authored temporary inputs, without a separate binary, installed consumer or backend.
func TestBuildEmitObservations(t *testing.T) {
	project := writeLlmRouteBuildProject(t, llmRouteBuildProjectOptions{Valid: true})
	source := "import { TypedRoute } from '@nestia/core'; import type { Shape } from './shape'; export class Controller { @TypedRoute.Get() get(): Shape { return { value: 'ok' }; } }"
	files := map[string]string{
		"src/main.ts":     source,
		"src/shape.ts":    "export interface Shape { value: string; ambient?: AmbientValue }",
		"src/global.d.ts": "interface AmbientValue { enabled: boolean }",
		"base.json":       `{"compilerOptions":{"strict":true}}`,
	}
	config, err := os.ReadFile(filepath.Join(project.Root, "tsconfig.json"))
	if err != nil {
		t.Fatal(err)
	}
	files["tsconfig.json"] = strings.Replace(strings.Replace(string(config), "{", `{"extends":"./base.json",`, 1), `"src/main.ts"`, `"src/main.ts", "src/global.d.ts"`, 1)
	for name, text := range files {
		writeFile(t, filepath.Join(project.Root, name), text)
	}
	wrapper := filepath.Join(t.TempDir(), "runtime.json")
	encoded, err := json.Marshal(map[string]any{"extends": filepath.Join(project.Root, "tsconfig.json")})
	if err != nil {
		t.Fatal(err)
	}
	writeFile(t, wrapper, string(encoded))
	t.Setenv(driver.SemanticConfigPathEnv, filepath.Join(project.Root, "tsconfig.json"))
	resultPath := filepath.Join(project.Root, "observations.json")
	_, errors, code := runCoreNative([]string{"build", "--cwd", project.Root, "--tsconfig", wrapper, "--plugins-json", project.PluginsJSON, "--emit-observations-json", resultPath})
	if code != 0 {
		t.Fatalf("observed build: %d\n%s", code, errors)
	}
	var result struct {
		Graph    *driver.TransformGraph `json:"graph"`
		Complete *bool                  `json:"observationsComplete"`
	}
	data, err := os.ReadFile(resultPath)
	if err != nil {
		t.Fatal(err)
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatal(err)
	}
	if result.Graph == nil || (result.Complete != nil && !*result.Complete) {
		t.Fatalf("missing graph authority: %#v", result)
	}
	for name, text := range files {
		hash := sha256.Sum256([]byte(text))
		actual := result.Graph.InputHashes[name]
		physical := result.Graph.InputRealpaths[name]
		expected, err := filepath.EvalSymlinks(filepath.Join(project.Root, name))
		if err != nil {
			t.Fatal(err)
		}
		if actual == nil || *actual != hex.EncodeToString(hash[:]) || physical == nil || *physical != expected {
			t.Errorf("incorrect generation proof for %s: hash=%v path=%v", name, actual, physical)
		}
	}
	if !slices.Contains(result.Graph.Edges["src/main.ts"], "src/shape.ts") || !slices.Contains(result.Graph.Globals, "src/global.d.ts") {
		t.Errorf("lost type or ambient dependency: %#v", result.Graph)
	}
	if !slices.Equal(result.Graph.Configs, []string{"tsconfig.json", "base.json"}) {
		t.Errorf("lost authored config identity: %v", result.Graph.Configs)
	}
	if result.Graph.InputHashes["node_modules/@nestia/core/package.json"] == nil {
		t.Error("missing transform package ownership read")
	}
	output := filepath.Join(project.OutDir, "main.js")
	emitted, err := os.ReadFile(output)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(emitted), "typeof input.value") || !strings.Contains(string(emitted), "_jsonStringifyString") {
		t.Fatalf("core/typia transform did not run:\n%s", emitted)
	}
	t.Setenv(driver.SemanticConfigPathEnv, "")
	_, errors, code = runCoreNative([]string{"build", "--cwd", project.Root, "--plugins-json", project.PluginsJSON})
	plain, err := os.ReadFile(output)
	if code != 0 || err != nil || string(plain) != string(emitted) {
		t.Fatalf("plain emission differs: code=%d err=%v\n%s", code, err, errors)
	}
	for _, scenario := range []struct {
		name, source, config, payload string
		status                        int
		loaded                        bool
	}{
		{"semantic", "export const value: string = 42;", "tsconfig.json", "", 2, true},
		{"transform", "", "tsconfig.json", "", 3, true},
		{"missing", source, "absent.json", "", 2, false},
		{"payload", source, "tsconfig.json", "{", 2, false},
	} {
		t.Run(scenario.name, func(t *testing.T) {
			p := writeLlmRouteBuildProject(t, llmRouteBuildProjectOptions{})
			if scenario.source != "" {
				writeFile(t, filepath.Join(p.Root, "src/main.ts"), scenario.source)
			}
			payload := scenario.payload
			if payload == "" {
				payload = p.PluginsJSON
			}
			resultPath := filepath.Join(p.Root, "result.json")
			_, errors, code := runCoreNative([]string{"build", "--cwd", p.Root, "--tsconfig", scenario.config, "--plugins-json", payload, "--emit-observations-json", resultPath})
			if code != scenario.status {
				t.Fatalf("status=%d want=%d\n%s", code, scenario.status, errors)
			}
			data, err := os.ReadFile(resultPath)
			if err != nil {
				t.Fatal(err)
			}
			result.Graph, result.Complete = nil, nil
			if err := json.Unmarshal(data, &result); err != nil {
				t.Fatal(err)
			}
			if (result.Graph != nil) != scenario.loaded {
				t.Fatalf("wrong graph: %#v", result)
			}
			if !scenario.loaded && (result.Complete == nil || *result.Complete) {
				t.Fatal("missing generation claimed complete proof")
			}
			if scenario.loaded && result.Graph.InputHashes["src/main.ts"] == nil {
				t.Fatal("diagnostic lost its input proof")
			}
		})
	}
	for _, scenario := range []struct {
		path   string
		status int
	}{{"relative.json", 2}, {project.Root, 3}} {
		_, errors, code := runCoreNative([]string{"build", "--cwd", project.Root, "--plugins-json", project.PluginsJSON, "--emit-observations-json", scenario.path})
		if code != scenario.status {
			t.Fatalf("private channel status=%d want=%d\n%s", code, scenario.status, errors)
		}
	}
}
