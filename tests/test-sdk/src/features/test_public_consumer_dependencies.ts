const assert = require("node:assert/strict");
const {
  publicConsumerDependencies,
} = require("../../../../config/testing/PublicConsumer.ts");

/**
 * Verifies a shared installation preserves every owner's frozen direct version.
 *
 * Selecting one owner's conflicting dependency would silently change the other
 * owner's compiler or runtime. Equal versions may share while conflicts
 * reject.
 *
 * 1. Combine empty, shared, disjoint, aliased and workspace dependency records.
 * 2. Require their literal union and reject adjacent conflicting versions.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual dependency union returns authored frozen versions, skips workspace links and rejects incompatible versions instead of choosing the first or last owner.
 * @evidence contracts/testing.md#independent-expectations Literal versions identify the caller's frozen dependencies. Sharing must preserve those identities independently of owner order; workspace packages are supplied by archive preparation.
 * @evidence contracts/testing.md#distinguishing-cases Empty and singleton importers, equal versions with different peer suffixes, disjoint development and optional dependencies, npm alias identities, workspace links and conflicting registry or alias versions distinguish valid sharing from silent replacement. Original input objects remain unchanged.
 * @evidence contracts/testing.md#execution-ownership Node test discovers the matching exported case in the SDK unit population. Authored lock records reach the pure owner directly without packing, installation, compilation or a host.
 */
export function test_public_consumer_dependencies(): void {
  assert.deepEqual(publicConsumerDependencies([]), {});
  const first = {
    dependencies: {
      typia: { version: "12.0.0(typescript@5.9.3)" },
      "@nestia/core": { version: "link:../../packages/core" },
      alias: { version: "actual@1.2.3" },
    },
  };
  const second = {
    devDependencies: { typia: { version: "12.0.0(typescript@5.8.3)" } },
    optionalDependencies: { extra: { version: "2.0.0" } },
  };
  const original = JSON.stringify([first, second]);
  assert.deepEqual(publicConsumerDependencies([first]), {
    typia: "12.0.0",
    alias: "actual@1.2.3",
  });
  for (const owners of [
    [first, second],
    [second, first],
    [first, first, second],
  ])
    assert.deepEqual(publicConsumerDependencies(owners), {
      typia: "12.0.0",
      alias: "actual@1.2.3",
      extra: "2.0.0",
    });
  assert.equal(JSON.stringify([first, second]), original);
  for (const conflicting of [
    { dependencies: { typia: { version: "12.0.1" } } },
    { devDependencies: { alias: { version: "other@1.2.3" } } },
  ])
    assert.throws(
      () => publicConsumerDependencies([first, conflicting]),
      /Conflicting integration dependency/,
    );
}
