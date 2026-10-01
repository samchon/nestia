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
// successful result, pinning the success side of the branch. This success case
// alone cannot detect skipped LLM validation; the strict diagnostic table owns
// rejected body types and optional-property rules.
//
//  1. Transform the body feature's TypedBodyController with an llm:true manifest.
//  2. Assert the transform succeeds (exit 0) — the body DTO is LLM-expressible.
//
// @evidence contracts/testing.md#behavioral-verification The body controller with llm true must transform with exit 0, detecting rejection of an expressible body DTO.
// @evidence contracts/testing.md#independent-expectations The authored body DTO uses supported JSON fields and non-strict LLM mode permits its shape; successful acceptance follows that type contract.
// @evidence contracts/testing.md#distinguishing-cases This is the non-strict body positive. Success alone cannot prove the LLM check ran; build_llm_strict_diagnostic_cases owns strict body/query negatives, non-strict controls and unsupported response diagnostics.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit function and executes the native dispatcher in the test process against real fixture source. Temporary configuration/output files belong to t.TempDir; no consumer installation or native host process is started.
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
