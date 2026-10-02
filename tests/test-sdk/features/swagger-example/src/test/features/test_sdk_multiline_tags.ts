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
