const assert = require("node:assert/strict");
const {
  SwaggerDescriptionComposer,
} = require("../../../../packages/sdk/lib/generates/internal/SwaggerDescriptionComposer");

/**
 * Verifies JSDoc summaries select a nonempty text part within a matching tag.
 *
 * A tag can contain an empty text part before its actual summary. Selection
 * must retain that explicit summary instead of falling back to prose.
 *
 * 1. Supply matching tags with empty and nonempty parts and an unrelated tag.
 * 2. Assert only nonempty matching text is returned in tag order.
 * 3. Compare explicit-summary selection with the prose fallback control.
 *
 * @evidence contracts/testing.md#behavioral-verification The original nonempty matching JSDoc parts retain tag order and explicit-summary precedence over prose; empty matching parts use the original fallback.
 * @evidence contracts/testing.md#independent-expectations Authored empty/nonempty tag text and literal prose establish the expected summaries independently of the composer.
 * @evidence contracts/testing.md#distinguishing-cases Matching and unrelated tags, empty and nonempty parts, explicit summaries and prose fallback retain every original distinction.
 * @evidence contracts/testing.md#execution-ownership The SDK unit entry discovers this matching JavaScript file and exported function in the same language-preparation process as TypeScript units. It calls caller-built product operations with authored input, without installation, native compilation, a host or a child process.
 */
function test_sdk_swagger_description_nonempty_text() {
  const jsDocTags = [
    {
      name: "summary",
      text: [
        { kind: "text", text: "" },
        { kind: "text", text: "Explicit summary" },
      ],
    },
    { name: "summary", text: [{ kind: "text", text: "" }] },
    { name: "title", text: [{ kind: "text", text: "Unrelated title" }] },
    { name: "summary", text: [{ kind: "text", text: "Second summary" }] },
  ];
  assert.deepEqual(
    SwaggerDescriptionComposer.getJsDocTexts({ jsDocTags, name: "summary" }),
    ["Explicit summary", "Second summary"],
  );
  assert.deepEqual(
    SwaggerDescriptionComposer.getJsDocTexts({
      jsDocTags: [jsDocTags[1]],
      name: "summary",
    }),
    [],
  );
  assert.deepEqual(
    SwaggerDescriptionComposer.compose({
      jsDocTags,
      description: "Fallback sentence.",
      kind: "summary",
    }),
    { summary: "Explicit summary", description: "Fallback sentence." },
  );
  assert.deepEqual(
    SwaggerDescriptionComposer.compose({
      jsDocTags: [jsDocTags[1], jsDocTags[2]],
      description: "Fallback sentence.",
      kind: "summary",
    }),
    { summary: "Fallback sentence", description: "Fallback sentence." },
  );
}
module.exports = { test_sdk_swagger_description_nonempty_text };
