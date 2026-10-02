const assert = require("node:assert/strict");
const {
  SwaggerDescriptionComposer,
} = require("../../packages/sdk/lib/generates/internal/SwaggerDescriptionComposer");

/**
 * Verifies JSDoc summaries select a nonempty text part within a matching tag.
 *
 * A tag can contain an empty text part before its actual summary. Selection
 * must retain that explicit summary instead of falling back to prose.
 *
 * 1. Supply matching tags with empty and nonempty parts and an unrelated tag.
 * 2. Assert only nonempty matching text is returned in tag order.
 * 3. Compare explicit-summary selection with the prose fallback control.
 */
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
