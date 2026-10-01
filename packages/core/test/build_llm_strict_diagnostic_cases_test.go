package test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestBuildLlmStrictDiagnosticCases exercises strict LLM rejection of optional
// body/query properties and an unsupported response WeakMap without launching
// a native host for each rule. Non-strict optional-property controls must build.
//
// The fixtures remain the original test-transform-options inputs. Each named
// subtest builds directly through the dispatcher with local streams and outputs.
// The remaining noEmit wrapper case verifies ttsc forwards that host protocol.
//
// @evidence contracts/testing.md#behavioral-verification Native builds must reject optional body/query properties under strict LLM mode and a WeakMap response with exit 3, the responsible decorator and schema reason, without publishing output. Non-strict versions of both optional DTOs must emit successfully.
// @evidence contracts/testing.md#independent-expectations Strict LLM schemas require object properties, and WeakMap is unsupported; the handwritten fixtures establish these differences. Expected exit classifications and decorator names are literals, independent of generated validators.
// @evidence contracts/testing.md#distinguishing-cases The two optional-property negatives have otherwise identical non-strict positive controls; the response case requires its original WeakMap reason and source line. Actual noEmit wrapper forwarding remains in test-transform-options rather than being inferred from direct dispatch.
// @evidence contracts/testing.md#execution-ownership The core Go module discovers this table case and invokes runCoreNative in the existing test binary. No compiler child or installed host is created per rule; t.TempDir owns every configuration and output.
func TestBuildLlmStrictDiagnosticCases(t *testing.T) {
	root := repoRootForCore(t)
	suite := filepath.Join(root, "tests/test-transform-options")
	for _, item := range []struct {
		source    string
		strict    bool
		failure   bool
		decorator string
		reason    string
	}{
		{"llm-body", true, true, "nestia.core.TypedBody", "optional"},
		{"llm-query", true, true, "nestia.core.TypedQuery", "optional"},
		{"llm-route", true, true, "nestia.core.TypedRoute", "LLM schema does not support WeakMap type."},
		{"llm-body", false, false, "", ""},
		{"llm-query", false, false, "", ""},
	} {
		name := item.source + "-non-strict"
		if item.strict {
			name = item.source + "-strict"
		}
		t.Run(name, func(t *testing.T) {
			temp := t.TempDir()
			out := filepath.Join(temp, "output")
			config := filepath.Join(temp, "tsconfig.json")
			contents, err := json.Marshal(map[string]any{
				"extends": filepath.ToSlash(filepath.Join(suite, "tsconfig.base.json")),
				"compilerOptions": map[string]any{
					"rootDir": filepath.ToSlash(filepath.Join(suite, "src")), "outDir": filepath.ToSlash(out), "types": []string{},
					"paths": map[string]any{"@nestia/core": []string{filepath.ToSlash(filepath.Join(root, "packages/core/lib/index.d.ts"))}},
				},
				"files": []string{filepath.ToSlash(filepath.Join(suite, "src", item.source+".ts"))}, "include": []string{},
			})
			if err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(config, contents, 0o600); err != nil {
				t.Fatal(err)
			}
			plugins, err := json.Marshal([]any{map[string]any{"name": "@nestia/core", "stage": "transform", "config": map[string]any{"transform": "@nestia/core/lib/transform", "llm": map[string]any{"strict": item.strict}}}})
			if err != nil {
				t.Fatal(err)
			}
			stdout, stderr, code := runCoreNative([]string{"build", "--cwd", suite, "--tsconfig", config, "--emit", "--verbose", "--plugins-json", string(plugins)})
			if item.failure {
				if code != 3 || !strings.Contains(stderr, item.decorator) || !strings.Contains(stderr, item.reason) {
					t.Fatalf("expected schema diagnostic exit 3 for %s (%s), got %d\n%s\n%s", item.decorator, item.reason, code, stdout, stderr)
				}
				if item.source == "llm-route" && (!strings.Contains(filepath.ToSlash(stderr), "src/llm-route.ts:11:4") || !strings.Contains(stderr, "IArticle.weak: WeakMap")) {
					t.Fatalf("response diagnostic lost its original source or type\n%s", stderr)
				}
				if _, err := os.Stat(out); !os.IsNotExist(err) {
					t.Fatalf("failed build published output or cannot establish its absence: %v", err)
				}
			} else {
				if code != 0 {
					t.Fatalf("non-strict optional DTO was rejected (%d)\n%s\n%s", code, stdout, stderr)
				}
				if _, err := os.Stat(filepath.Join(out, item.source+".js")); err != nil {
					t.Fatalf("successful control emitted no runtime artifact: %v", err)
				}
			}
		})
	}
}
