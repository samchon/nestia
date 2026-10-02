import fs from "fs";

/**
 * Verifies the SDK clone generator does not emit duplicate component schemas.
 *
 * `clone: true` rewrites every controller-facing type into the generated SDK
 * namespace. A regression in `SdkAliasCollection` previously produced one
 * schema per traversal pass, doubling components like `IAuth.IAccount`. This
 * fixture pins the canonical name set; throwing on drift keeps the runtime
 * report visible to `DynamicExecutor`. The previous implementation used
 * `console.error`, which the harness silently swallowed.
 *
 * 1. Read the generated `swagger.json`.
 * 2. Diff `components.schemas` keys against the expected canonical set.
 * 3. Throw on any unexpected key so the harness records the failure.
 */
export const test_no_duplicate_schemas = async () => {
  const swagger = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
  );
  // `Exception.Unauthorized = IBody<"UNAUTHORIZED">` collapses to the single
  // alias name `Exception.Unauthorized` (it no longer unfolds the literal
  // generic argument into the schema key). The point of this fixture is that
  // *no name appears twice*; the canonical-set check catches the
  // duplicate-schema regression that motivated the dir name.
  const expected = [
    "Exception.Unauthorized",
    "IAuth.IAccount",
    "IUser.IProfile",
  ];
  const schemas = Object.keys(swagger.components.schemas);
  const unexpected = schemas.filter((key) => !expected.includes(key));
  if (unexpected.length > 0)
    throw new Error(
      `schema was generated duplicately: ${unexpected.join(", ")}`,
    );
  if (schemas.length !== expected.length)
    throw new Error(
      `expected ${expected.length} component schemas, got ${schemas.length}`,
    );
};
