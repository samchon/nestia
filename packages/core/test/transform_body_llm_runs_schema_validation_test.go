package test

import (
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestTransformBodyLlmRunsSchemaValidation verifies that enabling the core
// plugin's llm option drives the @TypedBody LLM-schema validation branch of
// nestiaCoreValidateTypedBody and still emits a body validator when the DTO is
// LLM-expressible.
//
// nestiaCoreValidateTypedBody only builds the LlmSchemaProgrammer.Validate
// closure when options.Llm is set; with the default (non-llm) manifest that arm
// stays dark, and the strict-query LLM test only exercises the query path. A
// non-strict llm manifest over a clean body DTO runs the body LLM validator to a
// successful result, pinning the success side of the branch. A regression that
// skipped LLM validation for bodies would let an unexpressible body type through.
//
//  1. Transform the body feature's TypedBodyController with an llm:true manifest.
//  2. Assert the transform succeeds (exit 0) — the body DTO is LLM-expressible.
func TestTransformBodyLlmRunsSchemaValidation(t *testing.T) {
	cwd := featureRootForCore(t, "body")
	code := transform.Run([]string{
		"transform",
		"--cwd", cwd,
		"--tsconfig", "tsconfig.json",
		"--file", featureSource(t, "body", "controllers/TypedBodyController.ts"),
		"--plugins-json", `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"assert","stringify":"assert","llm":true}}]`,
	})
	if code != 0 {
		t.Fatalf("llm body transform over an expressible DTO should exit 0, got %d", code)
	}
}
