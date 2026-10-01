import cp from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies the `nestia-migrate` CLI reads a boolean flag given alone as `true`
 * and one given a value as that value.
 *
 * The flags were compared with the string `"true"`, and commander gives a flag
 * alone the boolean `true`, so `--keyword` alone migrated with `keyword: false`
 * (#1744).
 *
 * 1. Run the built CLI in NestJS mode with `--keyword`, `--keyword true`, and
 *    `--keyword false`.
 * 2. Assert the migrated `nestia.config.ts` has `keyword: true`, `true`, and
 *    `false`.
 *
 * @evidence contracts/testing.md#behavioral-verification It runs the built `nestia-migrate` executable three times with `--keyword`, `--keyword true`, and `--keyword false` and asserts the written `nestia.config.ts` carries `keyword: true`, `true`, and `false`.
 * @evidence contracts/testing.md#independent-expectations The values are the flags the test passes, so the expected configuration is the user's intent, not the CLI's own parse.
 * @evidence contracts/testing.md#distinguishing-cases The bare flag, the explicit true, and the explicit false are three cases; the bare flag is the one the string comparison broke.
 * @evidence contracts/testing.md#execution-ownership E2E: it runs in the E2E lane (`pnpm test:e2e`, the `test-migrate-e2e` suite), called by the suite entry `src/index.ts` after `nestia swagger` has generated the fixture document from a real project; the generated SDK and NestJS projects are compiled by `ttsc` in the same suite.
 * @evidence contracts/e2e.md#necessary-boundary Commander's parsing of a flag given alone is a real argument-vector behavior that in-process calls with an options object bypass, so only the built executable detects it.
 * @evidence contracts/e2e.md#shared-execution It shares the suite's build of `@nestia/migrate` and starts three short child processes on an empty document; no project is generated or compiled for it.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each run writes into a fresh temporary directory removed in a `finally`, so a value from one run cannot appear in the next.
 * @evidence contracts/e2e.md#preserved-coverage The generation logic behind the flag is unit-tested; this case keeps only the argument parsing that in-process calls cannot reach.
 */
export const test_migrate_cli_boolean_flags = (): void => {
  const root: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "nestia-migrate-"),
  );
  try {
    const input: string = path.join(root, "swagger.json");
    fs.writeFileSync(
      input,
      JSON.stringify({
        openapi: "3.1.0",
        info: { title: "cli", version: "1.0.0" },
        paths: {},
      }),
    );
    const executable: string = path.join(
      path.dirname(require.resolve("@nestia/migrate/package.json")),
      "lib",
      "executable",
      "migrate.js",
    );
    for (const [flag, expected] of [
      [["--keyword"], true],
      [["--keyword", "true"], true],
      [["--keyword", "false"], false],
    ] as const) {
      const output: string = path.join(root, `output-${flag.join("-")}`);
      cp.execFileSync(
        process.execPath,
        [
          executable,
          ...["--mode", "nest", "--input", input, "--output", output],
          ...flag,
          ...["--simulate", "false", "--e2e", "false", "--package", "cli"],
        ],
        { stdio: "pipe" },
      );
      const config: string = fs.readFileSync(
        path.join(output, "packages", "backend", "nestia.config.ts"),
        "utf8",
      );
      if (config.includes(`keyword: ${expected}`) === false)
        throw new Error(
          `${flag.join(" ")} should migrate keyword: ${expected}:\n${config}`,
        );
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};
