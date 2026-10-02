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
 * @evidence contracts/testing.md#behavioral-verification Compiles a consumer of generated DTOs and requires all valid assignments and expected invalid diagnostics to be consumed.
 * @evidence contracts/testing.md#independent-expectations TypeScript strict exactOptionalPropertyTypes semantics supply an independent compiler oracle.
 * @evidence contracts/testing.md#distinguishing-cases Omission, presence, explicit undefined, nesting, mapped types and tuples contrast with wrong values and missing required members.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Compiles a consumer of generated DTOs and requires all valid assignments and expected invalid diagnostics to be consumed. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Omission, presence, explicit undefined, nesting, mapped types and tuples contrast with wrong values and missing required members. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
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
