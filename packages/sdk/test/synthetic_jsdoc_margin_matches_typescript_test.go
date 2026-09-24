package test

import (
	"encoding/json"
	"testing"
)

// TestSyntheticJSDocMarginMatchesTypeScript verifies the SDK's JSDoc reader
// takes each comment's margin off as TypeScript does.
//
// The pre-v13 SDK read route documentation through TypeScript's
// `getDocumentationComment` and `getJsDocTags`; the Go reader that replaced
// them trimmed every line whole, so an indented code block in a description
// lost its indentation, and then kept too much once tags ran over lines. The
// margin is the `*` and the indentation up to the column the text began at:
// the description's first line, the text after a tag's name, or, when a tag's
// text starts on the next line, the tag itself. Each expectation below is what
// TypeScript 5.9's `getJsDocTags` and `getDocumentationComment` return for the
// same comment.
//
//  1. Author one method per comment shape: a wrapped `@param` below a
//     two-paragraph description, a description starting on the opening line,
//     an indented code block, an `@example` whose code starts on the next
//     line, and a two-space margin.
//  2. Run the SDK metadata pass over each in-process.
//  3. Assert the description and each tag's text equal TypeScript's.
func TestSyntheticJSDocMarginMatchesTypeScript(t *testing.T) {
	for _, expected := range []struct {
		comment     string
		description any
		tags        string
	}{
		{
			comment:     "/**\n   * Desc line one.\n   *\n   * Desc paragraph two.\n   *\n   * @param a first line\n   *   second line\n   * @returns the result\n   */",
			description: "Desc line one.\n\nDesc paragraph two.",
			tags:        `[{"name":"param","text":"a first line\nsecond line"},{"name":"returns","text":"the result"}]`,
		},
		{
			comment:     "/** Desc on the opening line\n   * and more\n   */",
			description: "Desc on the opening line\nand more",
			tags:        `[]`,
		},
		{
			comment:     "/**\n   * Example:\n   *\n   *     const x = 1;\n   *     return x;\n   */",
			description: "Example:\n\n    const x = 1;\n    return x;",
			tags:        `[]`,
		},
		{
			comment:     "/**\n   * Summary.\n   *\n   * @example\n   *   const a = 1;\n   *   if (a) {\n   *     go();\n   *   }\n   */",
			description: "Summary.",
			tags:        `[{"name":"example","text":"  const a = 1;\n  if (a) {\n    go();\n  }"}]`,
		},
		{
			comment:     "/**\n   *  Double space margin\n   *  second line\n   */",
			description: "Double space margin\nsecond line",
			tags:        `[]`,
		},
	} {
		controller := "import core from \"@nestia/core\";\n\nexport class SyntheticController {\n  " +
			expected.comment +
			"\n  @core.TypedRoute.Get(\"margin\")\n  public margin(@core.TypedQuery() a: { x?: string }): void {}\n}\n"
		metadata := decodeSyntheticMetadata(t, buildSyntheticMetadata(t, controller))
		if description := syntheticField(t, metadata, "description"); description != expected.description {
			t.Fatalf("description of %q is %q, expected %q", expected.comment, description, expected.description)
		}
		tags := []map[string]string{}
		for _, tag := range syntheticField(t, metadata, "jsDocTags").([]any) {
			text := ""
			if parts, ok := tag.(map[string]any)["text"].([]any); ok {
				for _, part := range parts {
					text += syntheticField(t, part, "text").(string)
				}
			}
			tags = append(tags, map[string]string{
				"name": syntheticField(t, tag, "name").(string),
				"text": text,
			})
		}
		actual, _ := json.Marshal(tags)
		if string(actual) != expected.tags {
			t.Fatalf("tags of %q are %s, expected %s", expected.comment, actual, expected.tags)
		}
	}
}
