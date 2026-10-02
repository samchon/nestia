package test

import (
	"strings"
	"testing"
)

// Verifies bare param and custom JSDoc tags retain name-only encoding.
//
// This authored pair exercises empty tag text without requiring a populated
// neighboring tag. Security and populated parameter/margin cases complement it.
//
//  1. Author a method whose JSDoc has a bare `@param` and a body-less `@custom`.
//  2. Run the SDK metadata pass over it in-process.
//  3. Assert both tags surface as name-only entries with no text.
//
// @evidence contracts/testing.md#behavioral-verification Empty param and custom tags must be emitted as name-only objects without a text key.
// @evidence contracts/testing.md#independent-expectations TypeScript represents a tag with no text as undefined; JSON omission preserves this meaning rather than inventing an empty text array.
// @evidence contracts/testing.md#distinguishing-cases Two tag spellings pin empty text handling; populated margin/param and native security-tag cases own nonempty text and security-tag omission.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSyntheticJSDocEmptyTags(t *testing.T) {
	const controller = `import core from "@nestia/core";

interface IPoint { x: number; }

export class SyntheticController {
  /**
   * Title.
   *
   * @param
   * @custom
   */
  @core.TypedRoute.Get("a")
  public a(): IPoint {
    return null!;
  }
}
`
	meta := buildSyntheticMetadata(t, controller)
	// Both tags appear as name-only objects: no "text" key follows the name.
	for _, expected := range []string{
		`{"name":"param"}`,
		`{"name":"custom"}`,
	} {
		if !strings.Contains(meta, expected) {
			t.Fatalf("empty JSDoc tag metadata is missing %q\n%s", expected, meta)
		}
	}
}
