package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
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
//  2. Assert the transform fails (nonzero exit) on the optional-property route.
func TestTransformLlmStrictQueryViolation(t *testing.T) {
	out := transformLlmStrict(t)
	if out == 0 {
		t.Fatal("strict LLM mode should reject the optional-property query route")
	}
}

func transformLlmStrict(t *testing.T) int {
	t.Helper()
	temp := t.TempDir()
	queryRoot := featureRootForCore(t, "query")
	tsconfig := writeExtendingTsconfig(t, temp, queryRoot, "", []string{
		featureSource(t, "query", "controllers/QueryController.ts"),
		featureSource(t, "query", "api/structures/IBigQuery.ts"),
		featureSource(t, "query", "api/structures/INestQuery.ts"),
		featureSource(t, "query", "api/structures/IQuery.ts"),
	})
	return transform.Run([]string{
		"transform",
		"--cwd", temp,
		"--tsconfig", tsconfig,
		"--file", featureSource(t, "query", "controllers/QueryController.ts"),
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert","llm":{"strict":true}}}]`,
	})
}
