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
 * @evidence contracts/testing.md#behavioral-verification Reads newly generated SDK documentation and asserts literal multiline example nesting and continued throws alignment.
 * @evidence contracts/testing.md#independent-expectations The controller-authored example indentation and TypeScript continued-tag column semantics establish the exact expected documentation.
 * @evidence contracts/testing.md#distinguishing-cases A next-line example body and a same-line throws description exercise both continuation layouts without equating generated output to itself.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-example/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-example controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-example feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-example test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_sdk_multiline_tags retain a next-line example body and a same-line throws description exercise both continuation layouts without equating generated output to itself.
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
