package test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestSourceTransformLlmStrictDiagnosticCases verifies strict LLM rejection of optional
// body/query properties and an unsupported response WeakMap without launching
// a native host for each rule. Non-strict optional-property controls must transform.
//
// Authored minimal declarations expose the same optional-property and WeakMap
// distinctions without installing Nest or compiling a runtime consumer.
//
//  1. Author one DTO and its owning decorator for each named schema case.
//  2. Apply strict and non-strict source transforms directly in-process.
//  3. Require rejection reasons and absent output, or injected valid output.
//
// @evidence contracts/testing.md#behavioral-verification Native source transforms reject optional body/query properties under strict LLM mode and WeakMap responses with exit 3, the responsible decorator and schema reason, without publishing output. Non-strict optional DTOs and required-property/supported-response strict controls must inject successfully.
// @evidence contracts/testing.md#independent-expectations Strict LLM schemas require object properties, and WeakMap is unsupported; the handwritten fixtures establish these differences. Expected exit classifications and decorator names are literals, independent of generated validators.
// @evidence contracts/testing.md#distinguishing-cases Optional body/query negatives have otherwise identical non-strict twins and strict required-property controls, both alone and beside an already required string property. Query controls include an optional number. WeakMap fails with strict both true and false, alone and beside a required id, while an ordinary response succeeds. The WeakMap diagnostic must retain its source and property type. Actual wrapper forwarding belongs to the common SDK integration population.
// @evidence contracts/testing.md#execution-ownership The core Go module discovers this table case and invokes the source-to-source operation in-process on authored files. No JavaScript consumer compilation, compiler child or installed host is created; t.TempDir owns declarations and output.
func TestSourceTransformLlmStrictDiagnosticCases(t *testing.T) {
	for _, item := range []struct {
		source    string
		strict    bool
		failure   bool
		decorator string
		reason    string
		property  string
	}{
		{"llm-body", true, true, "nestia.core.TypedBody", "optional", "value?: string"},
		{"llm-query", true, true, "nestia.core.TypedQuery", "optional", "value?: string"},
		{"llm-route", true, true, "nestia.core.TypedRoute", "LLM schema does not support WeakMap type.", "weak: WeakMap<object, object>"},
		{"llm-route", false, true, "nestia.core.TypedRoute", "LLM schema does not support WeakMap type.", "weak: WeakMap<object, object>"},
		{"llm-body", false, false, "", "", "value?: string"},
		{"llm-query", false, false, "", "", "value?: string"},
		{"llm-body", true, false, "", "", "value: string"},
		{"llm-query", true, false, "", "", "value: string"},
		{"llm-route", true, false, "", "", "value: string"},
		{"llm-body", true, true, "nestia.core.TypedBody", "optional", "title: string; thumbnail?: string"},
		{"llm-body", false, false, "", "", "title: string; thumbnail?: string"},
		{"llm-body", true, false, "", "", "title: string; thumbnail: string"},
		{"llm-query", true, true, "nestia.core.TypedQuery", "optional", "name: string; age?: number"},
		{"llm-query", false, false, "", "", "name: string; age?: number"},
		{"llm-query", true, false, "", "", "name: string; age: number"},
		{"llm-route", true, true, "nestia.core.TypedRoute", "LLM schema does not support WeakMap type.", "id: string; weak: WeakMap<object, object>"},
		{"llm-route", false, true, "nestia.core.TypedRoute", "LLM schema does not support WeakMap type.", "id: string; weak: WeakMap<object, object>"},
	} {
		name := item.source + "-non-strict-" + item.property
		if item.strict {
			name = item.source + "-strict-" + item.property
		}
		t.Run(name, func(t *testing.T) {
			project := writeLlmRouteBuildProject(t, llmRouteBuildProjectOptions{Valid: true})
			out := filepath.Join(project.Root, "transformed.ts")
			declarations := `export function TypedBody(): ParameterDecorator;
export function TypedQuery(): ParameterDecorator;
export namespace TypedRoute { function Get(): MethodDecorator; }`
			if err := os.WriteFile(project.CoreDeclaration, []byte(declarations), 0o600); err != nil {
				t.Fatal(err)
			}
			method := "public get(@TypedBody() input: IArticle): void {}"
			if item.source == "llm-query" {
				method = "public get(@TypedQuery() input: IArticle): void {}"
			} else if item.source == "llm-route" {
				method = "@TypedRoute.Get()\n  public get(): IArticle { throw new Error(); }"
			}
			source := "import { TypedBody, TypedQuery, TypedRoute } from \"@nestia/core\";\ninterface IArticle { " + item.property + "; }\nexport class Controller {\n  " + method + "\n}\n"
			if err := os.WriteFile(filepath.Join(project.Root, "src/main.ts"), []byte(source), 0o600); err != nil {
				t.Fatal(err)
			}
			plugins, err := json.Marshal([]any{map[string]any{"name": "@nestia/core", "stage": "transform", "config": map[string]any{"transform": "@nestia/core/lib/transform", "validate": "assert", "stringify": "assert", "llm": map[string]any{"strict": item.strict}}}})
			if err != nil {
				t.Fatal(err)
			}
			stdout, stderr, code := runCoreNative([]string{"transform", "--cwd", project.Root, "--tsconfig", "tsconfig.json", "--file", "src/main.ts", "--out", out, "--plugins-json", string(plugins)})
			if item.failure {
				if code != 3 || !strings.Contains(stderr, item.decorator) || !strings.Contains(stderr, item.reason) {
					t.Fatalf("expected schema diagnostic exit 3 for %s (%s), got %d\n%s\n%s", item.decorator, item.reason, code, stdout, stderr)
				}
				if item.source == "llm-route" && (!strings.Contains(filepath.ToSlash(stderr), "src/main.ts:4:4") || !strings.Contains(stderr, "IArticle.weak: WeakMap")) {
					t.Fatalf("response diagnostic lost its original source or type\n%s", stderr)
				}
				if _, err := os.Stat(out); !os.IsNotExist(err) {
					t.Fatalf("failed transform published output or cannot establish its absence: %v", err)
				}
			} else {
				if code != 0 {
					t.Fatalf("non-strict optional DTO was rejected (%d)\n%s\n%s", code, stdout, stderr)
				}
				text := mustReadFile(t, out)
				if !strings.Contains(text, "type: \"assert\"") {
					t.Fatalf("successful control injected no validator: %s", text)
				}
			}
		})
	}
}
