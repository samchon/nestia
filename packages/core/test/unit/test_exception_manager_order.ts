const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const path = require("node:path");
const {
  prepareUnitArtifacts,
} = require("../../../../config/testing/UnitArtifacts.ts");

/**
 * Verifies converter registrations always place subclasses before ancestors.
 *
 * The insertion comparator once contradicted itself for unrelated classes,
 * allowing a superclass converter to mask its subclass. Registration ordering
 * belongs to the core operation and needs no generated SDK or HTTP server.
 *
 * 1. Register the original four classes in all 24 permutations.
 * 2. Require each error's first matching registration to be its own class.
 * 3. Remove owned registrations and release the caller-built artifact view.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual built ExceptionManager insert and erase execute the original 24 permutations. The original first-instanceof match must identify each of DomainError, OtherError, NotFoundError and GoneError itself, preventing superclass masking across an intervening unrelated class.
 * @evidence contracts/testing.md#independent-expectations Authored inheritance independently establishes DomainError above NotFoundError above GoneError, with OtherError unrelated. Each most-specific class must precede its ancestors whatever the registration order; the original class names and four status values remain literal inputs.
 * @evidence contracts/testing.md#distinguishing-cases All permutations cover unrelated insertion between ancestor and descendant, reverse ancestry and neighboring subclasses; each iteration erases previous registrations before rebuilding them. The original four actual HTTP converter statuses remain with SDK integration.
 * @evidence contracts/testing.md#execution-ownership The core test:unit wildcard discovers this matching exported Node case. It consumes caller-built core and dependency bytes through the existing ordinary artifact view; internal tuple inspection remains with its core owner without public declaration casts, installation, compiler, child or host.
 */
export function test_exception_manager_order(): void {
  const artifacts = prepareUnitArtifacts(["@nestia/core"]);
  try {
    const requireArtifact = createRequire(
      path.join(artifacts.root, "package.json"),
    );
    const coreRoot = path.dirname(
      requireArtifact.resolve("@nestia/core/package.json"),
    );
    const { ExceptionManager } = requireArtifact(
      path.join(coreRoot, "lib/utils/ExceptionManager.js"),
    );
    const { HttpException } = require("@nestjs/common");
    class DomainError extends Error {}
    class OtherError extends Error {}
    class NotFoundError extends DomainError {}
    class GoneError extends NotFoundError {}
    const classes = [DomainError, OtherError, NotFoundError, GoneError];
    const statuses = new Map([
      [DomainError, 400],
      [OtherError, 409],
      [NotFoundError, 404],
      [GoneError, 410],
    ]);
    const permutations = <T>(list: readonly T[]): T[][] =>
      list.length <= 1
        ? [[...list]]
        : list.flatMap((first, i) =>
            permutations([...list.slice(0, i), ...list.slice(i + 1)]).map(
              (rest) => [first, ...rest],
            ),
          );
    try {
      for (const order of permutations(classes)) {
        for (const creator of classes) ExceptionManager.erase(creator);
        for (const creator of order)
          ExceptionManager.insert(
            creator,
            () => new HttpException("", statuses.get(creator)),
          );
        for (const creator of classes) {
          const matched = ExceptionManager.tuples.find(
            ([registered]: readonly [new () => Error, unknown]) =>
              new creator() instanceof registered,
          );
          assert.equal(
            matched?.[0]?.name,
            creator.name,
            `${order.map((c) => c.name).join(" -> ")}: ${creator.name}`,
          );
        }
      }
    } finally {
      for (const creator of classes) ExceptionManager.erase(creator);
    }
  } finally {
    artifacts.dispose();
  }
}
