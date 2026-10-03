import assert from "node:assert/strict";

import { selectMigrateScenarios } from "../internal/selectMigrateScenarios";

/**
 * Verifies migration selection rejects empty execution and preserves matches.
 *
 * Previously an unmatched --only command installed packages and generated
 * Swagger, then succeeded without any generated-program assertions. Selection
 * must reject that result without discarding valid default or substring input.
 *
 * 1. Reject an empty configured population and an unmatched substring.
 * 2. Retain default, partial, full and empty-string matches and record identity.
 * 3. Preserve the existing missing-value behavior and frozen caller inputs.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual scenario selection rejects zero configured or selected cases while preserving each matching record and original ordering for default and explicit substring invocation.
 * @evidence contracts/testing.md#independent-expectations The established --only contract uses name substrings; literal authored names and expected record lists distinguish selection from implementation-derived output. Generated-program execution requires at least one selected scenario.
 * @evidence contracts/testing.md#distinguishing-cases Empty population, zero match, singleton full match, one partial match, multiple matches, default, empty-string substring and a missing optional value cover the final population boundary while frozen inputs verify no mutation.
 * @evidence contracts/testing.md#execution-ownership The migrate direct unit entry discovers this matching TypeScript export. Authored records and argument arrays exercise the pure selection owner without files, installation, native compilation, CLI processes or hosts.
 */
export const test_migrate_nonempty_selection = (): void => {
  const fixture = Object.freeze({ name: "fixture", file: "fixture.json" });
  const second = Object.freeze({ name: "second-fixture", file: "second.json" });
  const scenarios = Object.freeze([fixture, second]);
  assert.throws(() => selectMigrateScenarios([], []), /No migration/);
  assert.throws(
    () => selectMigrateScenarios(scenarios, ["--only", "missing"]),
    /No migration/,
  );
  assert.deepEqual(selectMigrateScenarios(scenarios, []), [fixture, second]);
  assert.deepEqual(selectMigrateScenarios(scenarios, ["--only", "fixture"]), [
    fixture,
    second,
  ]);
  assert.deepEqual(selectMigrateScenarios(scenarios, ["--only", "second"]), [
    second,
  ]);
  assert.deepEqual(selectMigrateScenarios([fixture], ["--only", "fixture"]), [
    fixture,
  ]);
  assert.deepEqual(selectMigrateScenarios(scenarios, ["--only", ""]), [
    fixture,
    second,
  ]);
  assert.deepEqual(selectMigrateScenarios(scenarios, ["--only"]), [
    fixture,
    second,
  ]);
  assert.equal(
    selectMigrateScenarios(scenarios, ["--only", "second"])[0],
    second,
  );
  assert.deepEqual(scenarios, [fixture, second]);
};
