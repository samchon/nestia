package test

import (
	"strings"
	"testing"
)

// TestTransformLlmStrictQueryViolation verifies that enabling the core plugin's
// llm.strict option drives nestiaCoreLlmConfig and rejects a query route whose
// DTO carries an optional property the LLM schema cannot express.
//
// The llm config branch is only taken when the plugin manifest includes an
// `llm` block; without a test that supplies it, both nestiaCoreLlmConfig and the
// strict-mode diagnostic stay dark. Strict LLM mode forbids optional object
// properties, so a query DTO with one must fail the transform (exit 3). A
// regression that ignored the llm config would silently accept the route and
// emit an invalid LLM schema downstream.
//
//  1. Transform the query feature with an llm:{strict:true} core manifest.
//  2. Assert the transform fails with exit 3 and a TypedQuery diagnostic naming
//     the optional property.
//
// @evidence contracts/testing.md#behavioral-verification A strict-LLM transform of the authored optional-property query must return exit 3 with a TypedQuery diagnostic naming the optional property rule rather than accepting it.
// @evidence contracts/testing.md#independent-expectations Strict LLM schema constraints reject the optional property declared by the query DTO, independently of transformer output.
// @evidence contracts/testing.md#distinguishing-cases This case owns rejection on the complete query fixture with its exit class and decorator; the strict diagnostic table supplies the minimal fixtures, source location and non-strict acceptance controls.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit function and executes the native dispatcher in the test process against real fixture source. Temporary configuration/output files belong to t.TempDir; no consumer installation or native host process is started.
func TestTransformLlmStrictQueryViolation(t *testing.T) {
	stderr, code := transformLlmStrict(t)
	if code != 3 || !strings.Contains(stderr, "error TS(nestia.core.TypedQuery)") || !strings.Contains(stderr, "optional") {
		t.Fatalf("strict LLM mode should reject the optional-property query route with exit 3 and a TypedQuery diagnostic, got %d:\n%s", code, stderr)
	}
}

func transformLlmStrict(t *testing.T) (string, int) {
	t.Helper()
	temp := t.TempDir()
	queryRoot := featureRootForCore(t, "query")
	tsconfig := writeExtendingTsconfig(t, temp, queryRoot, "", []string{
		featureSource(t, "query", "controllers/QueryController.ts"),
		featureSource(t, "query", "api/structures/IBigQuery.ts"),
		featureSource(t, "query", "api/structures/INestQuery.ts"),
		featureSource(t, "query", "api/structures/IQuery.ts"),
	})
	_, stderr, code := runCoreNative([]string{
		"transform",
		"--cwd", temp,
		"--tsconfig", tsconfig,
		"--file", featureSource(t, "query", "controllers/QueryController.ts"),
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert","llm":{"strict":true}}}]`,
	})
	return stderr, code
}
