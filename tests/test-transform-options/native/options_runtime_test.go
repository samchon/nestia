package test

import (
	"bytes"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestOptionsRuntime compiles the ten request-validator modes and six response
// stringifier modes plus alias and native-identity controls in one native test
// binary, then executes all generated
// validators in one Node process. Each mode keeps its own configuration and
// output; sharing a process does not substitute one mode's validator for another.
//
// Run with go test in this module. The parent JavaScript boundary runner owns
// package preparation and invokes this module once before its host-protocol cases.
//
// @evidence contracts/testing.md#behavioral-verification The native dispatcher emits each mode's JavaScript; verifyOptions accepts valid bodies, rejects wrong property types and distinguishes extra-field semantics, then checks header, query, path and stringifier metadata. Alias spelling retains injection, while user Blob declarations stay structural and DOM Blob stays nominal.
// @evidence contracts/testing.md#independent-expectations Literal mode-to-metadata pairs follow the public validator contract; independently authored inputs distinguish preserving, rejecting, copying and mutating extra properties. Expected values are not taken from generated code.
// @evidence contracts/testing.md#distinguishing-cases Ten request modes, six response modes including null, aliased decorators and two Blob provenance controls retain their former assertions. Each producer is a named Go subtest; failed producers still permit others to run. The runtime verifier also aggregates independent case failures, and no runtime assertion is accepted unless every producer succeeds.
// @evidence contracts/testing.md#execution-ownership The test-transform-options runner invokes this E2E Go module once; Go discovers TestOptionsRuntime and its mode subtests. One Node child loads emitted artifacts against installed typia helpers, unlike source-only Go assertions.
// @evidence contracts/e2e.md#necessary-boundary Generated native validators must execute with the installed JavaScript runtime; source metadata checks cannot prove clone and prune semantics. Remaining start.js cases own ttsc linking, transform envelopes and actual HTTP fallbacks.
// @evidence contracts/e2e.md#shared-execution Nineteen native dispatch calls share this single compiled test binary and one Node verifier, with no native host build or launch per input. Different plugin options or library inputs require separate driver programs and emitted products, not separate operating-system processes.
// @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each input has an isolated configuration and output under t.TempDir. Dispatch streams are local buffers; an explicit module-local decorator probe captures generated arguments without replacing a global loader. Actual typia helpers resolve from the suite installation. Go removes outputs after the Node child exits on success or failure.
// @evidence contracts/e2e.md#preserved-coverage The original ten body/header/query/path cases, six stringifier tags, alias metadata and user-versus-DOM Blob assertions remain in verifyOptions, strengthened with valid and malformed body controls. The disabled-host, noEmit, descriptor version, envelope and legacy plugin-list protocols remain actual ttsc boundaries in the parent suite.
func TestOptionsRuntime(t *testing.T) {
	suite, err := filepath.Abs("..")
	if err != nil {
		t.Fatal(err)
	}
	root := filepath.Clean(filepath.Join(suite, "../.."))
	output := t.TempDir()
	cases := []struct {
		name, source, key string
		value             any
	}{}
	for _, mode := range []string{"assert", "is", "validate", "assertEquals", "equals", "validateEquals", "assertClone", "validateClone", "assertPrune", "validatePrune"} {
		cases = append(cases, struct {
			name, source, key string
			value             any
		}{"validate-" + mode, "validate", "validate", mode})
	}
	for _, mode := range []string{"assert", "is", "validate", "stringify", "validate.log", "null"} {
		var value any = mode
		if mode == "null" {
			value = nil
		}
		cases = append(cases, struct {
			name, source, key string
			value             any
		}{"stringify-" + mode, "stringify", "stringify", value})
	}
	for _, control := range []struct {
		name, source, key string
		value             any
	}{
		{"aliases", "aliases", "validate", "validate"},
		{"native-global-user", "native-global/user", "validate", "assert"},
		{"native-global-runtime", "native-global/runtime", "validate", "assert"},
	} {
		cases = append(cases, control)
	}
	for _, item := range cases {
		t.Run(item.name, func(t *testing.T) {
			config := filepath.Join(output, item.name+".json")
			compilerOptions := map[string]any{
				"rootDir": filepath.ToSlash(filepath.Join(suite, "src")),
				"outDir":  filepath.ToSlash(filepath.Join(output, item.name)),
				"types":   []string{},
				"paths":   map[string]any{"@nestia/core": []string{filepath.ToSlash(filepath.Join(root, "packages/core/lib/index.d.ts"))}},
			}
			files := []string{filepath.ToSlash(filepath.Join(suite, "src", item.source+".ts"))}
			if item.name == "native-global-user" {
				compilerOptions["lib"] = []string{"ESNext"}
				files = append(files, filepath.ToSlash(filepath.Join(suite, "src/native-global/lib.custom.d.ts")))
			} else if item.name == "native-global-runtime" {
				compilerOptions["lib"] = []string{"ESNext", "DOM"}
			}
			body, err := json.Marshal(map[string]any{
				"extends":         filepath.ToSlash(filepath.Join(suite, "tsconfig.base.json")),
				"compilerOptions": compilerOptions,
				"files":           files,
				"include":         []string{},
			})
			if err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(config, body, 0o600); err != nil {
				t.Fatal(err)
			}
			entries := []any{map[string]any{
				"name": "@nestia/core", "stage": "transform",
				"config": map[string]any{"transform": "@nestia/core/lib/transform", item.key: item.value},
			}}
			if item.name == "native-global-user" || item.name == "native-global-runtime" {
				entries = append(entries, map[string]any{"name": "typia", "stage": "transform", "config": map[string]any{"transform": "typia/lib/transform"}})
			}
			plugins, err := json.Marshal(entries)
			if err != nil {
				t.Fatal(err)
			}
			var stdout, stderr bytes.Buffer
			code := transform.RunWithOutput([]string{"build", "--cwd", suite, "--tsconfig", config, "--emit", "--plugins-json", string(plugins)}, &stdout, &stderr)
			if code != 0 {
				t.Fatalf("native build exited %d\n%s\n%s", code, &stdout, &stderr)
			}
		})
	}
	if t.Failed() {
		return
	}
	node := os.Getenv("NESTIA_OPTIONS_NODE")
	if node == "" {
		node = "node"
	}
	command := exec.Command(node, filepath.Join(suite, "start.js"), "--verify-options", output)
	command.Dir = suite
	// Outputs are temporary rather than a repository fixture. Node must resolve
	// their actual installed typia helper imports from this suite's dependencies.
	command.Env = append(os.Environ(), "NODE_PATH="+filepath.Join(suite, "node_modules"))
	if result, err := command.CombinedOutput(); err != nil {
		t.Fatalf("runtime verifier: %v\n%s", err, result)
	}
}
