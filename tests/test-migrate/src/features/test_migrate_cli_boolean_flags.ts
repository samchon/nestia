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
