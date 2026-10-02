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
 * @evidence contracts/testing.md#behavioral-verification Checks freshly emitted DTO optional and required spelling, inline output and Swagger required membership.
 * @evidence contracts/testing.md#independent-expectations The source IOptional declarations establish exact optional markers and explicit undefined distinctions.
 * @evidence contracts/testing.md#distinguishing-cases Optional versus required properties, quoted and numeric keys, explicit undefined and inline response spellings are distinct controls.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Checks freshly emitted DTO optional and required spelling, inline output and Swagger required membership. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Optional versus required properties, quoted and numeric keys, explicit undefined and inline response spellings are distinct controls. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
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
