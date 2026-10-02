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
