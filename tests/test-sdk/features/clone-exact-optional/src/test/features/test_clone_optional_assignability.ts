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
 *
 * @evidence contracts/testing.md#behavioral-verification The actual TypeScript compiler consumes generated optional declarations and requires every expect-error directive to match a real diagnostic, while all authored valid assignments compile.
 * @evidence contracts/testing.md#independent-expectations TypeScript exactOptionalPropertyTypes semantics distinguish omission, explicit undefined, optional value types, required mapped members and required tuple elements independently of generated source spelling.
 * @evidence contracts/testing.md#distinguishing-cases Omitted and present values, explicit-undefined ownership, nested, mapped, generic, class, alias, intersection, discriminated union, array and tuple assignments retain their positive and negative controls.
 * @evidence contracts/testing.md#execution-ownership The original clone runtime entry discovers this matching case. Its compiler invocation establishes generated consumer assignability and finally removes only its newly created temporary directory.
 * @evidence contracts/e2e.md#necessary-boundary The real compiler must accept and reject consumers of the generated DTO; checking cloned source text alone cannot establish TypeScript assignment semantics.
 * @evidence contracts/e2e.md#shared-execution The existing generated API and installed TypeScript compiler serve both positive and negative assignments in one minimal consumer request, with no additional installation or product transform.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The emitted runtime root exists before a unique sibling consumer directory is created. The directory does not assume a local node_modules installation; normal ancestor resolution supplies the already installed dependencies, and finally releases the unique directory.
 * @evidence contracts/e2e.md#preserved-coverage Every original authored assignment and expect-error directive is unchanged, including exact optional flags and an empty diagnostic result requirement.
 */
export const test_clone_optional_assignability = async (): Promise<void> => {
  const root = path.resolve(__dirname, "../../..");
  const temporary = await fs.promises.mkdtemp(
    path.join(root, ".tmp-optional-consumer-"),
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
    // TypeScript's own compiler, the one ttsc wraps: assignability is the
    // compiler's semantics alone, and a ttsc launch from this unrelated
    // project root would build a transform plugin the check never uses
    const manifest = require.resolve("typescript/package.json", {
      paths: [path.dirname(require.resolve("ttsc/package.json"))],
    });
    const binary = path.resolve(
      path.dirname(manifest),
      require(manifest).bin.tsc,
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
