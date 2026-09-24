package test

import "testing"

// TestSyntheticParamTagParts verifies a method's JSDoc tags reach the SDK in
// the shape TypeScript's `JSDocTagInfo` gives them.
//
// The SDK generators read a `@param` tag's text as the parameter's name as a
// `parameterName` part, a space, and the description as a `text` part. The Go
// contributor wrote the whole body as one `text` part, so no generator could
// match a tag to its parameter: a WebSocket SDK function lost every `@param`
// line, and the HTTP generators' tag fallbacks never applied. It also ended
// every tag at its first line, so a description continued on the next line
// lost the rest, and it took a JSDoc type `{T}` or an optional parameter's
// brackets `[name]` for the name. A continued line keeps its indentation past
// the comment's `* ` margin, as TypeScript keeps it, and a default value may
// hold brackets of its own. Other tags keep their one `text` part.
//
//  1. Author a method documented with a two-line `@param`, a typed `@param`,
//     an optional bare `@param`, an optional `@param` whose default holds
//     brackets, and a two-line `@summary`.
//  2. Run the SDK metadata pass over it in-process.
//  3. Assert each tag's parts, and the parameter descriptions they give.
func TestSyntheticParamTagParts(t *testing.T) {
	const controller = `import core from "@nestia/core";
import { Query } from "@nestjs/common";

export class SyntheticController {
  /**
   * Store the content.
   *
   * @param input Content to store,
   *   across two lines
   * @param {string} typed Typed description
   * @param [flag]
   * @param [opt=[1,2]] Defaulted
   * @summary Store
   *   everything
   */
  @core.TypedRoute.Post("tags")
  public store(
    @core.TypedBody() input: string,
    @Query("typed") typed: string,
    @core.TypedQuery() flag: { on?: boolean },
    @Query("opt") opt?: string,
  ): void {}
}
`
	metadata := decodeSyntheticMetadata(t, buildSyntheticMetadata(t, controller))
	actual := canonicalJSON(t, syntheticField(t, metadata, "jsDocTags"))
	expected := `[` +
		`{"name":"param","text":[{"kind":"parameterName","text":"input"},{"kind":"space","text":" "},{"kind":"text","text":"Content to store,\n  across two lines"}]},` +
		`{"name":"param","text":[{"kind":"parameterName","text":"typed"},{"kind":"space","text":" "},{"kind":"text","text":"Typed description"}]},` +
		`{"name":"param","text":[{"kind":"parameterName","text":"flag"}]},` +
		`{"name":"param","text":[{"kind":"parameterName","text":"opt"},{"kind":"space","text":" "},{"kind":"text","text":"Defaulted"}]},` +
		`{"name":"summary","text":[{"kind":"text","text":"Store\n  everything"}]}` +
		`]`
	if actual != expected {
		t.Fatalf("method JSDoc tags are %s, expected %s", actual, expected)
	}

	descriptions := map[string]any{}
	for _, parameter := range syntheticField(t, metadata, "parameters").([]any) {
		descriptions[syntheticField(t, parameter, "name").(string)] = syntheticField(t, parameter, "description")
	}
	if actual := canonicalJSON(t, descriptions); actual != `{"flag":null,"input":"Content to store,\n  across two lines","opt":"Defaulted","typed":"Typed description"}` {
		t.Fatalf("parameter descriptions are %s", actual)
	}
}
