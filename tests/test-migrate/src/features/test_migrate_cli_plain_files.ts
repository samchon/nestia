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
