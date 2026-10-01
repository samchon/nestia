import { OpenApiV3_1 } from "@typia/interface";

/**
 * A valid OpenAPI 3.1 document that declares no operation, which migration must
 * still turn into an SDK that compiles.
 */
export const EMPTY_PATHS_DOCUMENT = {
  openapi: "3.1.0",
  info: {
    title: "Empty Paths",
    version: "1.0.0",
  },
  paths: {},
} satisfies OpenApiV3_1.IDocument;
