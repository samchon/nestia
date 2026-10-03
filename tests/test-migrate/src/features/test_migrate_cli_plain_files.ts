import fs from "fs";
import path from "path";

import { NestiaMigrateCommander } from "../../../../packages/migrate/lib/executable/NestiaMigrateCommander";

/**
 * Verifies the `nestia-migrate` CLI writes its plain-text files as they are,
 * formatting only TypeScript.
 *
 * The CLI ran every written file through prettier's TypeScript parser, which
 * accepts a `.gitignore` or `.env` line as code, so `lib/` became `lib /
 * node_modules / swagger.json;` and `API_PORT=37001` became `API_PORT = 37001;`
 * (#1742).
 *
 * 1. Call the built command operation in NestJS mode on an empty document.
 * 2. Assert the api `.gitignore` and the backend `.env.local` are the template's
 *    lines, and a TypeScript file is still written.
 *
 * @evidence contracts/testing.md#behavioral-verification The built command operation archives a real generated project; the first gitignore line and complete env value must remain literal text while MyModule TypeScript is still written.
 * @evidence contracts/testing.md#independent-expectations The authored template contract spells lib/ and API_PORT=37001 as plain text, independently of Prettier's TypeScript interpretation.
 * @evidence contracts/testing.md#distinguishing-cases Plain gitignore/env output is compared with the TypeScript module from the same invocation so omitting all writes cannot replace the archive path. CLI dispatch is a separate integration boundary.
 * @evidence contracts/testing.md#execution-ownership The migrate entry awaits this direct command/parser/writer unit using temporary filesystem input and output and built artifacts; it launches no CLI child, compiler, installation or host.
 */
export const test_migrate_cli_plain_files = async (): Promise<void> => {
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
    await NestiaMigrateCommander.main([
      process.execPath,
      "nestia-migrate",
      ...["--mode", "nest", "--input", input, "--output", output],
      ...["--keyword", "true", "--simulate", "false", "--e2e", "false"],
      ...["--package", "cli"],
    ]);
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
