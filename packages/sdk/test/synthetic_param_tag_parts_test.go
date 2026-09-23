package test

import "testing"

// TestSyntheticParamTagParts verifies a method's `@param` tag keeps the
// parameter's name apart from its description.
//
// The SDK generators read JSDoc tags in the shape TypeScript's
// `JSDocTagInfo` has: a `@param` tag's text is the name as a
// `parameterName` part, a space, and the description as a `text` part. The
// Go contributor wrote the whole body as one `text` part, so no generator
// could match a tag to its parameter: a WebSocket SDK function lost every
// `@param` line, and the HTTP generators' tag fallbacks never applied. Other
// tags keep their one `text` part.
//
//  1. Author a method documented with a described `@param`, a bare `@param`,
//     and a `@summary`.
//  2. Run the SDK metadata pass over it in-process.
//  3. Assert each tag's parts.
func TestSyntheticParamTagParts(t *testing.T) {
	const controller = `import core from "@nestia/core";

export class SyntheticController {
  /**
   * Store the content.
   *
   * @param input Content to store
   * @param flag
   * @summary Store
   */
  @core.TypedRoute.Post("tags")
  public store(
    @core.TypedBody() input: string,
    @core.TypedQuery() flag: { on?: boolean },
  ): void {}
}
`
	metadata := decodeSyntheticMetadata(t, buildSyntheticMetadata(t, controller))
	actual := canonicalJSON(t, syntheticField(t, metadata, "jsDocTags"))
	expected := `[` +
		`{"name":"param","text":[{"kind":"parameterName","text":"input"},{"kind":"space","text":" "},{"kind":"text","text":"Content to store"}]},` +
		`{"name":"param","text":[{"kind":"parameterName","text":"flag"}]},` +
		`{"name":"summary","text":[{"kind":"text","text":"Store"}]}` +
		`]`
	if actual != expected {
		t.Fatalf("method JSDoc tags are %s, expected %s", actual, expected)
	}
}
