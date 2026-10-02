import cp from "child_process";
import fs from "fs";
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
 * @evidence contracts/testing.md#behavioral-verification The built migrate CLI runs with bare, textual true and textual false keyword options; generated backend configuration must select the corresponding calling convention.
 * @evidence contracts/testing.md#independent-expectations Commander bare flags mean true and the documented textual true/false options establish the three literal expectations.
 * @evidence contracts/testing.md#distinguishing-cases Bare true, explicit true and explicit false distinguish presence from text comparison; every other option is supplied to prevent prompting.
 * @evidence contracts/testing.md#execution-ownership The test-migrate entry calls test_migrate_cli_boolean_flags; it executes the built CLI in isolated subprocesses and temporary directories.
 * @evidence contracts/e2e.md#necessary-boundary The actual built CLI connects Commander options, input reading, template generation, formatting and filesystem archiving; direct generator calls cannot detect this process-level wiring.
 * @evidence contracts/e2e.md#shared-execution Each invocation reuses the one built migrate artifact. Boolean variants require separate CLI lifetimes because Commander consumes process arguments; the plain-files case owns a separate archive for its file-format assertions.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A fresh directory under the ignored generated tree isolates each test, distinct output directories isolate CLI variants, synchronous children terminate before inspection, and finally removes the owned tree on success or assertion failure.
 * @evidence contracts/e2e.md#preserved-coverage The boolean flag variants and plain-text archiving assertions remain in their named CLI tests; portable schema and calling-convention generation is asserted by the neighboring direct generator tests.
 */
export const test_migrate_cli_boolean_flags = (): void => {
  const generated: string = path.join(__dirname, "../../.generated");
  fs.mkdirSync(generated, { recursive: true });
  const root: string = fs.mkdtempSync(path.join(generated, "nestia-migrate-"));
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
