import { TestValidator } from "@nestia/e2e";
import type { NestiaMigrateApplication as MigrateApplication } from "@nestia/migrate";
import type { OpenApiV3_1 } from "@typia/interface";
import { createRequire } from "module";
import path from "path";

/**
 * Verifies generated controller directories obey portable filename rules while
 * the route text and distinct controllers remain represented.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual migration produces controller files for device names, extension forms, trailing dots/spaces, invalid/control characters and safe neighbors. Literal expected directory components and controller counts detect invalid names and omitted controllers. The JavaScript engine reads each emitted Controller string and the router matcher verifies it matches the original URL and rejects an adjacent suffix.
 * @evidence contracts/testing.md#independent-expectations Microsoft Windows filename rules prohibit reserved devices even with extensions or superscript digits, ASCII control characters and trailing dots/spaces. The literal expectations apply that platform rule rather than the production sanitizer. The JavaScript engine and Nest's path-to-regexp decode the two distinct JavaScript and router syntaxes, so alternate hex/Unicode spellings and an escaped literal colon are compared by their actual URL meaning.
 * @evidence contracts/testing.md#distinguishing-cases Case-insensitive devices, device extensions, COM superscripts, trailing dot/space, control and punctuation cases require a change. CONSOLE, COM10, a safe name, and an already underscore-prefixed device are unchanged controls; NUL and _NUL share one directory but retain both independently named controller files.
 * @evidence contracts/testing.md#execution-ownership Unit: test-migrate discovers this callback and invokes migration in memory with an authored OpenAPI document. No generated project is installed, compiled or run and no native filesystem is needed to check portable output names.
 */
export const test_migrate_controller_portable_directories = (): void => {
  const { match } = createRequire(require.resolve("@nestjs/core"))(
    "path-to-regexp",
  ) as {
    match: (route: string) => (url: string) => false | unknown;
  };
  const { NestiaMigrateApplication } = require(
    path.resolve(
      process.cwd(),
      "../../packages/migrate/lib/NestiaMigrateApplication.js",
    ),
  ) as { NestiaMigrateApplication: typeof MigrateApplication };
  const cases: Array<[string, string]> = [
    ["CON", "_CON"],
    ["nul.txt", "_nul.txt"],
    ["COM1", "_COM1"],
    ["LPT²", "_LPT²"],
    ["AUX", "_AUX"],
    ["PRN", "_PRN"],
    ["trailing.", "trailing_"],
    ["trailing ", "trailing_"],
    ["control\u0001", "control_"],
    ["items:batch", "items_batch"],
    ["CONSOLE", "CONSOLE"],
    ["COM10", "COM10"],
    ["safe", "safe"],
    ["NUL", "_NUL"],
    ["_NUL", "_NUL"],
  ];
  const document: OpenApiV3_1.IDocument = {
    openapi: "3.1.0",
    info: { title: "Portable controller directories", version: "1" },
    paths: Object.fromEntries(
      cases.map(([segment], index) => [
        `/${segment}/items`,
        {
          get: {
            "x-samchon-controller": `Fixture${index}Controller`,
            operationId: `fixture${index}`,
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": { schema: { type: "string" } },
                },
              },
            },
          },
        },
      ]),
    ),
  };
  const files = NestiaMigrateApplication.assert(document).nest({
    keyword: false,
    simulate: false,
    e2e: false,
  });
  const controllers = Object.keys(files).filter((key) =>
    key.endsWith("Controller.ts"),
  );
  TestValidator.equals(
    "every controller retained",
    controllers.length,
    cases.length,
  );
  for (const [[segment, expected], index] of cases.map(
    (c, i) => [c, i] as const,
  )) {
    const key = `packages/backend/src/controllers/${expected}/items/Fixture${index}Controller.ts`;
    TestValidator.predicate(
      `portable directory ${JSON.stringify(segment)}`,
      key in files,
    );
    const controller = files[key]!.match(
      /@Controller\(\s*("(?:[^"\\]|\\.)*")\s*\)/,
    );
    TestValidator.predicate(
      `controller route literal ${JSON.stringify(segment)}`,
      controller !== null,
    );
    const matcher = match(new Function(`return ${controller![1]}`)());
    TestValidator.predicate(
      `original route ${JSON.stringify(segment)}`,
      matcher(`/${segment}/items`) !== false,
    );
    TestValidator.equals(
      `adjacent URL rejected ${JSON.stringify(segment)}`,
      matcher(`/${segment}/items/other`),
      false,
    );
  }
};
