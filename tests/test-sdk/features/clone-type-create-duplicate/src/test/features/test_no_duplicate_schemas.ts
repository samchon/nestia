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
 *
 * @evidence contracts/testing.md#behavioral-verification Requires the freshly generated component key set to contain exactly three authored reachable aliases.
 * @evidence contracts/testing.md#independent-expectations Exception.Unauthorized, IAuth.IAccount and IUser.IProfile are the authored reachable aliases, not an emitted snapshot oracle.
 * @evidence contracts/testing.md#distinguishing-cases Unexpected keys and missing keys independently fail the canonical-set check.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Requires the freshly generated component key set to contain exactly three authored reachable aliases. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Unexpected keys and missing keys independently fail the canonical-set check. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
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
