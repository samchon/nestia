import { OpenApi } from "@typia/interface";
import assert from "assert/strict";

import { SwaggerOperationComposer } from "../../../../packages/sdk/lib/generates/internal/SwaggerOperationComposer";
import { SwaggerUnitRoute } from "../internal/SwaggerUnitRoute";

/**
 * Verifies ordered tag merging and first-description ownership.
 *
 * Controller, method and JSDoc tags share a document registry. Repeated names
 * must retain their first position and description without leaking tags into an
 * operation which declares none.
 *
 * 1. Compose controller/method/comment tags with overlapping names.
 * 2. Compose another operation with conflicting descriptions in the same document.
 * 3. Contrast untagged input and an explicitly configured document description.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual SwaggerOperationComposer.compose merges controller, route and comment tags into the literal ordered bbs/public/write list. It registers each name once, retains the first nonempty description and leaves an untagged operation empty without changing the document registry.
 * @evidence contracts/testing.md#independent-expectations The public tag contract combines controller, method and JSDoc names with first-description ownership. Literal authored names, descriptions and order are independent expected values; configured descriptions must not be overwritten by route comments.
 * @evidence contracts/testing.md#distinguishing-cases Overlapping controller/method/comment tags distinguish stable deduplication from concatenation. Missing and conflicting descriptions distinguish first-description ownership, while untagged input and a preconfigured description pin absence and document precedence. The shared installed tags case separately owns decorator reflection.
 * @evidence contracts/testing.md#execution-ownership The SDK unit entry discovers this matching export with plugins off against built artifacts. Complete authored route/document records directly reach the composer without a filesystem, compiler, consumer, application or child process.
 */
export const test_sdk_swagger_tags = (): void => {
  const document: OpenApi.IDocument = {
    openapi: "3.2.0",
    info: { title: "Tags", version: "1" },
    paths: {},
    components: {},
    "x-typia-emended-v12": true,
  };
  const route = SwaggerUnitRoute();
  route.controller.tags = ["bbs"];
  route.tags = ["public", "write", "bbs"];
  route.jsDocTags = [
    {
      name: "tag",
      text: [{ kind: "text", text: "public Public description" }],
    },
    { name: "tag", text: [{ kind: "text", text: "write Write accessor" }] },
  ];
  const compose = (input: ReturnType<typeof SwaggerUnitRoute>) =>
    SwaggerOperationComposer.compose({
      route: input,
      document,
      config: {},
      schema: () => undefined,
    });
  assert.deepEqual(compose(route).tags, ["bbs", "public", "write"]);
  assert.deepEqual(document.tags, [
    { name: "bbs" },
    { name: "public", description: "Public description" },
    { name: "write", description: "Write accessor" },
  ]);
  route.jsDocTags = [
    { name: "tag", text: [{ kind: "text", text: "bbs First description" }] },
    { name: "tag", text: [{ kind: "text", text: "public Replacement" }] },
  ];
  assert.deepEqual(compose(route).tags, ["bbs", "public", "write"]);
  const expected = [
    { name: "bbs", description: "First description" },
    { name: "public", description: "Public description" },
    { name: "write", description: "Write accessor" },
  ];
  assert.deepEqual(document.tags, expected);
  assert.deepEqual(compose(SwaggerUnitRoute()).tags, []);
  assert.deepEqual(document.tags, expected);
  document.tags = [{ name: "public", description: "Configured description" }];
  const configured = SwaggerUnitRoute();
  configured.jsDocTags = [
    { name: "tag", text: [{ kind: "text", text: "public Replacement" }] },
  ];
  assert.deepEqual(compose(configured).tags, ["public"]);
  assert.deepEqual(document.tags, [
    { name: "public", description: "Configured description" },
  ]);
};
