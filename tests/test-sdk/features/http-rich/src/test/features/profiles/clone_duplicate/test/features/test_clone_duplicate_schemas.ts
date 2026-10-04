import fs from "fs";

/**
 * Verifies the SDK clone generator does not emit duplicate component schemas.
 *
 * `clone: true` rewrites every controller-facing type into the generated SDK
 * namespace. A regression in `SdkAliasCollection` previously produced one
 * schema per traversal pass, doubling components like
 * `CloneDuplicateIAuth.IAccount`. This fixture pins the canonical name set;
 * throwing on drift keeps the runtime report visible to `DynamicExecutor`. The
 * previous implementation used `console.error`, which the harness silently
 * swallowed.
 *
 * 1. Read the generated `swagger.json`.
 * 2. Diff `components.schemas` keys against the expected canonical set.
 * 3. Throw on any unexpected key so the harness records the failure.
 *
 * @evidence contracts/testing.md#behavioral-verification The installed clone generator must emit exactly the three authored component identities, rejecting both unexpected components and a changed component count.
 * @evidence contracts/testing.md#independent-expectations The original controller-facing namespaces and exception alias define the literal three-key set independently of generated output.
 * @evidence contracts/testing.md#distinguishing-cases An extra or duplicate-name component fails the unexpected-key check; a missing component fails the exact count. The original exception generic alias and nested account/user type connection remain.
 * @evidence contracts/testing.md#execution-ownership The matching case executes through DynamicExecutor in the shared compiled consumer and reads its actual profile document.
 * @evidence contracts/e2e.md#necessary-boundary Public native controller metadata, SDK cloning and Swagger composition must agree on component identity through a real installed generation.
 * @evidence contracts/e2e.md#shared-execution This distinct clone/primitive profile keeps its original options while sharing the installed graph, producer, consumer and listener with every other profile. It generates no automated E2E cases.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private controller/type/route identities isolate the graph; this case reads a unique profile document and has no mutable controller state.
 * @evidence contracts/e2e.md#preserved-coverage The original literal expected set, unexpected-key failure and exact component-count failure are unchanged apart from private namespace prefixes and document location.
 */
export const test_clone_duplicate_schemas = async () => {
  const swagger = JSON.parse(
    await fs.promises.readFile(
      `${__dirname}/../../../../../../../profiles/clone_duplicate/swagger.json`,
      "utf8",
    ),
  );
  // `CloneDuplicateException.Unauthorized = IBody<"UNAUTHORIZED">` collapses to the single
  // alias name `CloneDuplicateException.Unauthorized` (it no longer unfolds the literal
  // generic argument into the schema key). The point of this fixture is that
  // *no name appears twice*; the canonical-set check catches the
  // duplicate-schema regression that motivated the dir name.
  const expected = [
    "CloneDuplicateException.Unauthorized",
    "CloneDuplicateIAuth.IAccount",
    "CloneDuplicateIUser.IProfile",
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
