import cp from "child_process";
import fs from "fs";
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
 * @evidence contracts/testing.md#behavioral-verification The built migrate CLI must preserve the gitignore first line and environment assignment while emitting its TypeScript module.
 * @evidence contracts/testing.md#independent-expectations The template text lib/ and API_PORT=37001 are configuration literals that must retain their file-format meaning independently of TypeScript formatting.
 * @evidence contracts/testing.md#distinguishing-cases Plain dotfile and environment content expose accidental TypeScript formatting; the module assertion guards continued TypeScript output.
 * @evidence contracts/testing.md#execution-ownership The test-migrate entry calls test_migrate_cli_plain_files; it executes the built CLI in isolated subprocesses and temporary directories.
 * @evidence contracts/e2e.md#necessary-boundary The actual built CLI connects Commander options, input reading, template generation, formatting and filesystem archiving; direct generator calls cannot detect this process-level wiring.
 * @evidence contracts/e2e.md#shared-execution Each invocation reuses the one built migrate artifact. Boolean variants require separate CLI lifetimes because Commander consumes process arguments; the plain-files case owns a separate archive for its file-format assertions.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A fresh directory under the ignored generated tree isolates each test, distinct output directories isolate CLI variants, synchronous children terminate before inspection, and finally removes the owned tree on success or assertion failure.
 * @evidence contracts/e2e.md#preserved-coverage The boolean flag variants and plain-text archiving assertions remain in their named CLI tests; portable schema and calling-convention generation is asserted by the neighboring direct generator tests.
 */
export const test_migrate_cli_plain_files = (): void => {
  const generated: string = path.join(__dirname, "../../.generated");
  fs.mkdirSync(generated, { recursive: true });
  const root: string = fs.mkdtempSync(path.join(generated, "nestia-migrate-"));
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
