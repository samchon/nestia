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
 * @evidence contracts/testing.md#behavioral-verification The actual generated document must have exactly the three canonical keys Exception.Unauthorized/IAuth.IAccount/IUser.IProfile; extra renamed traversal copies and missing components fail the subset-plus-count checks.
 * @evidence contracts/testing.md#independent-expectations The authored controller-facing types and named Unauthorized alias establish the expected canonical exported component names. The list is handwritten from those declarations, not captured from current output.
 * @evidence contracts/testing.md#distinguishing-cases Nested account/profile and literal-generic Unauthorized alias exercise repeated traversal/name canonicalization. JSON object keys cannot duplicate the same spelling; this detects additional renamed duplicates, not a same-key overwrite or incorrect schema body.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by its feature DynamicExecutor after actual generation and consumer compilation. Compiler identity controls fail preparation; runtime mismatches reject the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This connects clone alias collection and serialized OpenAPI components through the actual generator. A source symbol table alone cannot establish the emitted canonical component set.
 * @evidence contracts/e2e.md#shared-execution Packed packages and compatible producer/runtime compilations are shared. These assertions start no independent installation/compiler; sibling transport cases reuse the feature backend, while distinct CLI/file-pattern boundaries retain their own lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Authored inputs and generated outputs belong to isolated feature trees; values are local and output reads are immutable. The entry rejects empty discovery and finally closes its backend; harness cleanup waits for consuming children before releasing owned trees.
 * @evidence contracts/e2e.md#preserved-coverage Every original literal/tag identity, verdict input, parameter flag, schema key, shape or alias request remains. Independent bigint/date checks strengthen selected shared-oracle/shape-only assertions; related clone and routing scenarios retain their separate executable owners.
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
