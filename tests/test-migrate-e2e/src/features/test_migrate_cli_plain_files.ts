import cp from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies the `nestia-migrate` CLI writes its plain-text files as they are,
 * formatting only TypeScript.
 *
 * The CLI ran every written file through prettier's TypeScript parser, which
 * accepts a `.gitignore` or `.env` line as code, so `lib/` became `lib /
 * node_modules / swagger.json;` and `API_PORT=37001` became `API_PORT = 37001;`
 * (#1742).
 *
 * 1. Run the built CLI in NestJS mode on an empty document.
 * 2. Assert the api `.gitignore` and the backend `.env.local` are the template's
 *    lines, and a TypeScript file is still written.
 *
 * @evidence contracts/testing.md#behavioral-verification It runs the built executable in NestJS mode on an empty document and asserts the api `.gitignore` and the backend `.env.local` hold the template's lines while a TypeScript file is still written.
 * @evidence contracts/testing.md#independent-expectations The expected lines are the template's own literal lines, which a `.gitignore` or `.env` file must keep, whatever a formatter would do to them as code.
 * @evidence contracts/testing.md#distinguishing-cases Plain-text files and a TypeScript file are written by one run; the formatter must change the second and leave the first two as they are.
 * @evidence contracts/testing.md#execution-ownership E2E: it runs in the E2E lane (`pnpm test:e2e`, the `test-migrate-e2e` suite), called by the suite entry `src/index.ts` after `nestia swagger` has generated the fixture document from a real project; the generated SDK and NestJS projects are compiled by `ttsc` in the same suite.
 * @evidence contracts/e2e.md#necessary-boundary The formatting happens in the CLI's file writer, after generation and before the disk, so only a real run against the filesystem shows what reaches the files.
 * @evidence contracts/e2e.md#shared-execution It is one child process on an empty document, sharing the suite's build.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Its output directory is temporary and removed afterwards.
 * @evidence contracts/e2e.md#preserved-coverage The generated file set is unit-tested by the migrate tests in `test-migrate`; this case keeps the on-disk content.
 */
export const test_migrate_cli_plain_files = (): void => {
  const root: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "nestia-migrate-"),
  );
  try {
    const input: string = path.join(root, "swagger.json");
    const output: string = path.join(root, "output");
    fs.writeFileSync(
      input,
      JSON.stringify({
        openapi: "3.1.0",
        info: { title: "cli", version: "1.0.0" },
        paths: {},
      }),
    );
    cp.execFileSync(
      process.execPath,
      [
        path.join(
          path.dirname(require.resolve("@nestia/migrate/package.json")),
          "lib",
          "executable",
          "migrate.js",
        ),
        ...["--mode", "nest", "--input", input, "--output", output],
        ...["--keyword", "true", "--simulate", "false", "--e2e", "false"],
        ...["--package", "cli"],
      ],
      { stdio: "pipe" },
    );
    const read = (file: string): string =>
      fs.readFileSync(path.join(output, file), "utf8");
    if (read("packages/api/.gitignore").split(/\r?\n/)[0] !== "lib/")
      throw new Error(
        `The .gitignore was rewritten:\n${read("packages/api/.gitignore")}`,
      );
    if (read("packages/backend/.env.local").trim() !== "API_PORT=37001")
      throw new Error(
        `The .env.local was rewritten:\n${read("packages/backend/.env.local")}`,
      );
    if (read("packages/backend/src/MyModule.ts").includes("MyModule") === false)
      throw new Error("The TypeScript module was not written.");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};
