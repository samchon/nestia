package test

import "testing"

// Verifies an empty `@security` JSDoc tag is carried into the SDK metadata
// with no `text`, so the Swagger generator can emit an optional security
// requirement.
//
// The metadata operation owns tag text independently of emitted JavaScript.
// Direct analysis isolates the bare-versus-populated decision.
//
//  1. Analyze an authored method with bare and populated security tags.
//  2. Decode the native OperationMetadata JSON literal.
//  3. Assert a bare `{"name":"security"}` tag survives next to a tagged one.
//
// @evidence contracts/testing.md#behavioral-verification SDK analysis must encode an empty security tag without text while retaining text parts for its neighboring populated security tag.
// @evidence contracts/testing.md#independent-expectations Empty and populated JSDoc tags have different TypeScript meanings; omission of empty text permits optional security rather than inventing a scheme string.
// @evidence contracts/testing.md#distinguishing-cases The same decoded metadata includes a name-only and populated security tag, distinguishing omission from dropping all tags. Synthetic empty custom/param and margin tests cover other JSDoc forms.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSDKMetadataKeepsEmptyJSDocTagsUndefined(t *testing.T) {
	const controller = `import core from "@nestia/core";
export class SyntheticController {
  /**
   * @security
   * @security bearer
   */
  @core.TypedRoute.Get()
  public get(): string { return "ok"; }
}
`
	metadata := decodeSyntheticMetadata(t, buildSyntheticMetadata(t, controller))
	tags := syntheticField(t, metadata, "jsDocTags").([]any)
	if len(tags) != 2 {
		t.Fatalf("expected two security tags, got %v", tags)
	}
	if actual := canonicalJSON(t, tags[0]); actual != `{"name":"security"}` {
		t.Fatalf("empty security tag = %s, want name without text", actual)
	}
	if syntheticField(t, tags[1], "name") != "security" {
		t.Fatalf("populated tag lost name: %v", tags[1])
	}
	parts := syntheticField(t, tags[1], "text").([]any)
	if len(parts) != 1 || syntheticField(t, parts[0], "text") != "bearer" {
		t.Fatalf("populated tag lost bearer text: %v", parts)
	}
}
