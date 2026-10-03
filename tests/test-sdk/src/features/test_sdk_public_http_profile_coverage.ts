import assert from "node:assert/strict";
import path from "node:path";

const {
  validatePublicHttpProfiles,
} = require("../../PublicHttpProfileCoverage");

/**
 * Verifies executor attribution rejects partial or duplicated SDK profiles.
 *
 * A nonempty overall report can hide a profile whose generated SDK tests never
 * executed. Authored execution records isolate this portable decision.
 *
 * 1. Supply two profiles, their complete records and an unrelated ordinary case.
 * 2. Reject missing generated/authored records, duplicates and parent-path
 *    impostors.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual coverage operation accepts complete attributed records and throws for a missing generated or authored record, duplicated generated execution, parent-path impostor, empty profiles and duplicate profile identities.
 * @evidence contracts/testing.md#independent-expectations Authored profiles require one generated and one authored execution each; explicit native paths and names establish their ownership independently of the operation's counters.
 * @evidence contracts/testing.md#distinguishing-cases Both profiles deliberately reuse generated function names but have different paths. Unrelated ordinary executions are harmless; empty, missing, duplicated and escaping records cannot conceal incomplete execution.
 * @evidence contracts/testing.md#execution-ownership The SDK unit entry discovers this matching file against caller-built artifacts. It calls the portable report operation with authored records and starts no filesystem, compiler, installation or product host.
 */
export const test_sdk_public_http_profile_coverage = (): void => {
  const root = path.resolve("caller-authored-profile-root");
  const profiles = ["alpha", "beta"].map((name) => ({
    name,
    expectedGeneratedCases: 1,
    expectedAuthoredCases: 1,
  }));
  const records = profiles.flatMap(({ name }) => [
    {
      location: path.join(root, name, "test/generated.js"),
      name: "test_api_shared",
    },
    {
      location: path.join(root, name, "test/authored.js"),
      name: "test_clone_authored",
    },
  ]);
  validatePublicHttpProfiles(profiles, root, records);
  validatePublicHttpProfiles(
    [{ ...profiles[0], name: "..alpha" }],
    root,
    records.slice(0, 2).map((record) => ({
      ...record,
      location: path.join(root, "..alpha", path.basename(record.location)),
    })),
  );
  validatePublicHttpProfiles(profiles, root, [
    ...records,
    { location: path.join(root, "../ordinary/test.js"), name: "test_ordinary" },
  ]);
  for (const index of [0, 1, 2, 3])
    assert.throws(
      () =>
        validatePublicHttpProfiles(
          profiles,
          root,
          records.filter((_, i) => i !== index),
        ),
      AggregateError,
    );
  assert.throws(
    () => validatePublicHttpProfiles(profiles, root, [...records, records[0]]),
    AggregateError,
  );
  assert.throws(
    () =>
      validatePublicHttpProfiles(profiles, root, [
        {
          ...records[0],
          location: path.join(root, "../alpha/test/generated.js"),
        },
        ...records.slice(1),
      ]),
    AggregateError,
  );
  assert.throws(() => validatePublicHttpProfiles([], root, []));
  assert.throws(() =>
    validatePublicHttpProfiles([profiles[0], profiles[0]], root, records),
  );
};
