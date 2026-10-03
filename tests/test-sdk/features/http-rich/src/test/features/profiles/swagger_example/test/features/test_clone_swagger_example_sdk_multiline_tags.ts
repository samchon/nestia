import { TestValidator } from "@nestia/e2e";
import fs from "fs";

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
 * @evidence contracts/testing.md#behavioral-verification The original generated SDK documentation or Swagger assertions distinguish preserved multiline text, examples and version-specific body/form/encryption representation.
 * @evidence contracts/testing.md#independent-expectations Literal original JSDoc strings, authored DTO types and OpenAPI3/Swagger2 requirements establish every retained expectation independently of generated output.
 * @evidence contracts/testing.md#distinguishing-cases Exact emitted example lines retain nested indentation below a next-line tag; the throws continuation aligns below same-line text. Both independent literal blocks must be present.
 * @evidence contracts/testing.md#execution-ownership The matching authored case is discovered in the shared installed consumer and reads the freshly generated document or SDK source from its owning profile.
 * @evidence contracts/e2e.md#necessary-boundary Actual native metadata, public SDK/Swagger generation and emitted documentation must agree; authored metadata units cannot establish the source-analysis connection.
 * @evidence contracts/e2e.md#shared-execution Both original document versions share one installed graph, producer, consumer and listener. Swagger2 excludes the same multiline controller and generates no SDK or automated cases.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique route, controller and DTO identities isolate source metadata. Document versions have separate outputs; original controller JSDoc text and literal example-code references are retained.
 * @evidence contracts/e2e.md#preserved-coverage Every original type assertion, literal string and document lookup remains after reversible type/path/export identities; all four original cases run and no new random requests are introduced.
 */
export const test_clone_swagger_example_sdk_multiline_tags =
  async (): Promise<void> => {
    const content: string = await fs.promises.readFile(
      `${__dirname}/../../../../../../../src/test/features/profiles/swagger_example/api/functional/http_rich/options/swagger_example/multiline/index.ts`,
      "utf8",
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
