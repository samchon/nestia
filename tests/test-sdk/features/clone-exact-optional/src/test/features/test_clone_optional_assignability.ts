import { TestValidator } from "@nestia/e2e";
import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

/**
 * Verifies cloned optional declarations obey TypeScript assignment semantics.
 *
 * Source-text checks alone cannot prove the generated type accepts omission
 * without accidentally accepting an invalid value. Compile both controls with
 * the real compiler and require every expected diagnostic to be consumed.
 *
 * 1. Create an isolated consumer importing only the generated DTO declarations.
 * 2. Compile omitted, present, explicit-undefined, nested, and tuple assignments.
 * 3. Require invalid optional values and missing required values to remain errors.
 */
export const test_clone_optional_assignability = async (): Promise<void> => {
  const root = path.resolve(__dirname, "../../..");
  const temporary = await fs.promises.mkdtemp(
    path.join(root, "node_modules/optional-consumer-"),
  );
  try {
    const relative = path
      .relative(temporary, path.join(root, "src/api/structures/IOptional"))
      .split(path.sep)
      .join("/");
    await fs.promises.writeFile(
      path.join(temporary, "consumer.ts"),
      `
import type { IOptional } from ${JSON.stringify(relative)};
const omitted: Pick<IOptional, "optional" | "nullable" | "explicit"> = {};
const present: Pick<IOptional, "optional" | "nullable"> = { optional: true, nullable: null };
const explicit: Pick<IOptional, "explicit"> = { explicit: undefined };
const nested: IOptional["nested"] = { requiredInner: true };
const mapped: IOptional["partial"] = {};
const generic: IOptional["generic"] = {};
const instance: IOptional["classValue"] = {};
const alias: IOptional["alias"] = {};
const intersection: IOptional["intersection"] = {right: "ok"};
const union: IOptional["union"] = {kind: "a"};
const array: IOptional["array"] = [{}];
const tuple: IOptional["tuple"] = ["ok", true];
// @ts-expect-error exact optional boolean excludes explicit undefined
const invalidUndefined: Pick<IOptional, "optional"> = {optional: undefined};
// @ts-expect-error an optional boolean still excludes strings
const invalidValue: Pick<IOptional, "optional"> = {optional: "wrong"};
// @ts-expect-error the required neighbor must remain required
const invalidRequired: Pick<IOptional, "required"> = {};
// @ts-expect-error Required removes the mapped optional marker
const invalidMapped: IOptional["requiredMapped"] = {};
// @ts-expect-error the required tuple element cannot be omitted
const invalidTuple: IOptional["tuple"] = [];
`,
    );
    await fs.promises.writeFile(
      path.join(temporary, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          exactOptionalPropertyTypes: true,
          skipLibCheck: true,
          noEmit: true,
          target: "ESNext",
          module: "NodeNext",
          moduleResolution: "NodeNext",
        },
        files: ["consumer.ts"],
      }),
    );
    const manifest = require.resolve("ttsc/package.json");
    const binary = path.resolve(
      path.dirname(manifest),
      require(manifest).bin.ttsc,
    );
    const result = await promisify(execFile)(
      process.execPath,
      [binary, "--project", path.join(temporary, "tsconfig.json")],
      { cwd: root },
    );
    TestValidator.equals("consumer diagnostics", result.stdout.trim(), "");
  } finally {
    await fs.promises.rm(temporary, { recursive: true, force: true });
  }
};
