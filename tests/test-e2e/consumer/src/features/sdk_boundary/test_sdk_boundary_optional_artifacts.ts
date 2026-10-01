import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Verifies actual cloned declarations and Swagger retain optional distinctions.
 *
 * Assignment controls independently check use; these artifact controls retain
 * spelling and wire-schema distinctions.
 *
 * 1. Read this boundary family's generated declaration files.
 * 2. Check optional/required members, inline Output and Swagger required controls.
 *
 * @evidence contracts/testing.md#behavioral-verification The original optional/required/quoted/numeric/undefined spellings occur in actual generated declarations; inline boolean excludes implicit undefined and Swagger required versus optional remains distinct.
 * @evidence contracts/testing.md#independent-expectations Authored ISdkBoundaryOptional contains each mapped, generic, class, alias, recursive and key form; wire undefined fields are optional while exact optional boolean does not acquire undefined.
 * @evidence contracts/testing.md#distinguishing-cases Fifteen optional names contrast five required neighbors, quoted/numeric keys, explicit undefined and inline response.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer discovers this one matching named export and awaits its actual connection/artifact assertions after the single consumer compilation.
 * @evidence contracts/e2e.md#necessary-boundary Native metadata must reach the installed clone/Swagger writers and actual generated artifacts, rather than a committed declaration snapshot.
 * @evidence contracts/e2e.md#shared-execution One packed installation, producer, generated consumer and backend supply these observations; no additional compiler or host is created.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity SDK boundary routes and type names isolate these stateless specimens. Reads concern only the current sandbox artifacts and every acquired response/reader is consumed or released before the common host closes.
 * @evidence contracts/e2e.md#preserved-coverage All original clone optional property/source and Swagger controls retain this family-scoped generated destination; compile assignment and Express runtime controls have their own cases.
 */
export const test_sdk_boundary_optional_artifacts = async (): Promise<void> => {
  const sandbox = path.resolve(__dirname, "../../..");
  const structures = path.join(sandbox, "consumer/src/api/structures");
  const files = (await fs.readdir(structures)).filter(
    (file) => file.includes("SdkBoundaryOptional") && file.endsWith(".ts"),
  );
  assert.ok(files.length > 0, "no cloned optional family");
  const source = (
    await Promise.all(
      files.map((file) => fs.readFile(path.join(structures, file), "utf8")),
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
    assert.match(source, new RegExp(`\\b${name}\\?:`), `${name} optional`);
  for (const name of ["required", "requiredInner", "fixed", "right", "kind"]) {
    assert.match(source, new RegExp(`\\b${name}:`), `${name} required`);
    assert.doesNotMatch(
      source,
      new RegExp(`\\b${name}\\?:`),
      `${name} not optional`,
    );
  }
  assert.match(source, /"quoted-key"\?:/);
  assert.match(source, /"?42"?\?:/);
  assert.match(source, /explicit\?:[^;]*undefined/);
  assert.match(source, /optional\?: boolean;/);
  const inline = await fs.readFile(
    path.join(
      sandbox,
      "consumer/src/api/functional/sdk_boundary/optional/index.ts",
    ),
    "utf8",
  );
  assert.match(inline, /optional\?: boolean;/);
  const swagger = JSON.parse(
    await fs.readFile(path.join(sandbox, "swagger.json"), "utf8"),
  );
  const schema = swagger.components.schemas.ISdkBoundaryOptional;
  assert.ok(schema.required.includes("required"));
  assert.ok(!schema.required.includes("optional"));
};
