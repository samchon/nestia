import { TestValidator } from "@nestia/e2e";

import { SwaggerParameterReader } from "./internal/SwaggerPreservationReader";

/**
 * Verifies the SDK function carries tags whose text runs over lines so that
 * TypeScript reads them back as the controller wrote them.
 *
 * TypeScript takes a continued line's margin off up to the column the tag's
 * text began at, and keeps the indentation beyond it. The SDK trimmed every
 * continued line and indented it to the text's column, so an `@example`'s code
 * lost its nesting in the SDK function's documentation. A text starting on the
 * tag's line now continues at that column, and one starting on the next line,
 * as an `@example`'s code does, keeps its own indentation there.
 *
 * 1. Read the generated SDK file of `MultilineController`.
 * 2. Assert the `@example` code keeps its indentation below the tag.
 * 3. Assert the `@throws` description continues under its first line.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated @example code retains nesting and @throws continuation retains description alignment.
 * @evidence contracts/testing.md#independent-expectations The authored multiline controller comment and TypeScript tag continuation columns establish exact text needles independently of SDK printing.
 * @evidence contracts/testing.md#distinguishing-cases A tag whose text starts on the next line contrasts one starting beside the tag; indented code contrasts prose continuation.
 * @evidence contracts/testing.md#execution-ownership The matching sole export is discovered and awaited by the existing installed rich consumer after actual native SDK/Swagger generation; any assertion rejection fails its report.
 * @evidence contracts/e2e.md#necessary-boundary Actual controller decorators/JSDoc/type metadata and final SDK or Swagger printing must connect through the native producer and installed generator. Isolated hand-constructed schema tests cannot certify these authored metadata inputs reach serialized output.
 * @evidence contracts/e2e.md#shared-execution The original output assertions read existing rich artifacts and reuse one installed producer, generator and consumer program without another application or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The reader anchors fresh artifacts to the caller-owned sandbox and does not mutate them; the shared entry owns resource cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Original multiline literal text, whitespace, tag, security, description and operationId controls remain with their distinct SDK or document owner. Source-exclusion and version-configuration connections stay pending.
 */
export const test_swaggerpreservation_example_sdk_multiline_tags =
  async (): Promise<void> => {
    const content: string = await SwaggerParameterReader.sdkSource(
      "functional/swagger_only/examples/multiline/index.ts",
    );
    TestValidator.equals(
      "@example",
      content.includes(
        [
          " * @example",
          " *   const article = await api.functional.multiline.read(connection);",
          " *   if (article.title.length !== 0) {",
          " *     console.log(article.title);",
          " *   }",
        ].join("\n"),
      ),
      true,
    );
    TestValidator.equals(
      "@throws",
      content.includes(
        [
          " * @throws 404 When nothing is found under the key it was asked for, even",
          ` * ${" ".repeat("@throws ".length)}after the fallback was consulted`,
        ].join("\n"),
      ),
      true,
    );
  };
