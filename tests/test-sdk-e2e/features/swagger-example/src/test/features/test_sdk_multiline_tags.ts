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
 * @evidence contracts/testing.md#behavioral-verification Generated @example code retains nesting and @throws continuation retains description alignment.
 * @evidence contracts/testing.md#independent-expectations The authored multiline controller comment and TypeScript tag continuation columns establish exact text needles independently of SDK printing.
 * @evidence contracts/testing.md#distinguishing-cases A tag whose text starts on the next line contrasts one starting beside the tag; indented code contrasts prose continuation.
 * @evidence contracts/testing.md#execution-ownership The matching test_sdk_multiline_tags export is discovered and awaited by its feature executor after native generation and emitted consumer execution; a failed assertion rejects its report and zero discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual controller decorators/JSDoc/type metadata and final SDK or Swagger printing must connect through the native producer and installed generator. Isolated hand-constructed schema tests cannot certify these authored metadata inputs reach serialized output.
 * @evidence contracts/e2e.md#shared-execution The swagger-example siblings consume one generated artifact population and share packed installation, compatible producer/runtime compilation and their entry-owned backend. These file/metadata assertions launch no compiler or application of their own.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case reads its own feature’s generated files or local SDK namespace, with paths anchored at __dirname. Submitted method-key values are local where applicable; entry/backend and harness/copied-tree ownership enclose execution.
 * @evidence contracts/e2e.md#preserved-coverage All test_sdk_multiline_tags selected flags, text, example shapes, visibility or method-key controls above remain in this executed owner. Compatible preparation sharing neither removes them nor substitutes compiler success for their assertions.
 */
export const test_sdk_multiline_tags = async (): Promise<void> => {
  const content: string = await fs.promises.readFile(
    `${__dirname}/../../api/functional/multiline/index.ts`,
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
