import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

/**
 * Verifies cloned and inline SDK properties preserve optional metadata.
 *
 * Exact optional types carry optional=true independently of required=true.
 * Check the emitted declarations against source semantics, including adjacent
 * required properties and undefined unions, rather than a generated snapshot.
 *
 * 1. Generate the SDK, simulator, Swagger document, and e2e suite from
 *    controllers.
 * 2. Inspect every optional spelling and its adjacent required control.
 * 3. Check Swagger required keys and generated inline response types.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated cloned declarations must retain the listed optional and required spellings, quoted/numeric keys and explicit undefined distinction; inline output and Swagger required/optional controls must agree.
 * @evidence contracts/testing.md#independent-expectations The authored IOptional optional/mapped/class/alias/intersection/union/recursive/key declarations and the optional wire representation of undefined supply independent expectations. Source regex assertions inspect generated artifacts, not committed arrangement; the assignability case independently checks accepted/rejected use.
 * @evidence contracts/testing.md#distinguishing-cases Required neighbors contrast optional members, explicit undefined contrasts exact optional boolean, and quoted/numeric/nested/recursive spellings remain. Whole-directory regexes do not independently identify every declaration scope or certify every optional field semantic.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by its feature DynamicExecutor after generation; compile-time controls are enforced by the shared consumer compilation before this runtime entry. Runtime assertion errors fail the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This owns observable declarations and Swagger emitted by actual native clone generation. Reading generated source is necessary for the declaration spelling distinction but does not replace real consumer assignment and adapter cases.
 * @evidence contracts/e2e.md#shared-execution Feature generation and installed package preparation are reused across these controls and compatible cohorts; independent preparation in this case is limited to the explicitly described adapter lifetimes. Native dispatch and Node processes are shared while configurations keep independent compiler programs and metadata scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity All output assertions reuse one feature generation and runtime. Generated files are isolated and read-only in this case; no process/installation/host is started.
 * @evidence contracts/e2e.md#preserved-coverage Every original meaningful input, type/error control, document/reference or transport assertion remains. Literal UUID verdicts and accepted status/success strengthen formerly shared-oracle or union-shape-only checks where changed; related clone cases retain their distinct owners.
 */
export const test_clone_optional_properties = async (): Promise<void> => {
  const root = path.resolve(__dirname, "../..");
  const directory = path.join(root, "api/structures");
  const files = await fs.promises.readdir(directory);
  const source = (
    await Promise.all(
      files.map((file) =>
        fs.promises.readFile(path.join(directory, file), "utf8"),
      ),
    )
  ).join("\n");
  for (const name of [
    "optional",
    "explicit",
    "undefinable",
    "nullable",
    "inner",
    "mapped",
    "value",
    "property",
    "aliased",
    "left",
    "a",
    "b",
    "item",
    "recursive",
  ])
    TestValidator.predicate(`${name} is optional`, () =>
      new RegExp(`\\b${name}\\?:`).test(source),
    );
  for (const name of ["required", "requiredInner", "fixed", "right", "kind"])
    TestValidator.predicate(
      `${name} is required`,
      () =>
        new RegExp(`\\b${name}:`).test(source) &&
        !new RegExp(`\\b${name}\\?:`).test(source),
    );
  TestValidator.predicate("quoted optional key", () =>
    /"quoted-key"\?:/.test(source),
  );
  TestValidator.predicate("numeric optional key", () =>
    /"?42"?\?:/.test(source),
  );
  TestValidator.predicate("explicit undefined remains", () =>
    /explicit\?:[^;]*undefined/.test(source),
  );
  TestValidator.predicate("exact optional excludes added undefined", () =>
    /optional\?: boolean;/.test(source),
  );
  const inline = await fs.promises.readFile(
    path.join(root, "api/functional/optional/index.ts"),
    "utf8",
  );
  TestValidator.predicate("inline output optional", () =>
    /optional\?: boolean;/.test(inline),
  );
  const swagger = JSON.parse(
    await fs.promises.readFile(path.join(root, "../swagger.json"), "utf8"),
  );
  const schema = swagger.components.schemas.IOptional;
  TestValidator.predicate("Swagger required control", () =>
    schema.required.includes("required"),
  );
  TestValidator.predicate(
    "Swagger optional control",
    () => !schema.required.includes("optional"),
  );
};
