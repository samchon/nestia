const assert = require("node:assert/strict");
const path = require("node:path");

/**
 * Rejects missing or duplicated executed cases in each authored SDK profile.
 *
 * A surviving pagination case must not conceal missing generated SDK transport
 * cases. Original controller routes and authored assertion owners establish the
 * expected populations; executor reports establish what actually ran.
 *
 * @evidence contracts/common.md#principled-implementation Each actual execution is attributed by its native path below the caller's profile root. Exact generated and authored counts distinguish incomplete execution from a populated but partial profile.
 * @evidence contracts/common.md#clear-and-simple-design One profile counter map separates attribution from final comparison. Unrelated ordinary cases remain outside these profile counts; mismatches are aggregated across all profiles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The function consumes actual execution records rather than checking source filenames or substituting results. It never suppresses a case failure, retries execution or rewrites generated artifacts.
 * @evidence contracts/common.md#meaningful-documentation The comment explains why nonempty overall discovery cannot prove complete profile coverage; diagnostics identify each expected and actual population.
 * @evidence contracts/portability.md#os-neutral-implementation node:path relative/isAbsolute/sep interpret execution locations on the current native platform. Parent paths cannot contribute to an owned profile and no filesystem or shell is used.
 * @evidence contracts/performance.md#efficient-algorithms One pass attributes executions through a profile map and one pass checks profiles, using O(executions + profiles) time and O(profiles) counters.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing executor report supplies every actual record; no discovery, import, compilation or request is repeated to count it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Counters and mismatch messages exist only for this call. The function acquires no handles and retains no execution values or mutable profile state.
 */
function validatePublicHttpProfiles(profiles, root, executions) {
  assert(profiles.length > 0, "No SDK generation profiles were supplied.");
  const counts = new Map(
    profiles.map((profile) => [
      profile.name,
      { generated: 0, authored: 0, other: 0 },
    ]),
  );
  assert.equal(
    counts.size,
    profiles.length,
    "SDK profile identities must be unique.",
  );
  for (const execution of executions) {
    const relative = path.relative(root, execution.location);
    if (
      !relative ||
      relative === ".." ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)
    )
      continue;
    const count = counts.get(relative.split(path.sep)[0]);
    if (!count) continue;
    if (execution.name.startsWith("test_api_")) ++count.generated;
    else if (execution.name.startsWith("test_clone_")) ++count.authored;
    else ++count.other;
  }
  const errors = [];
  for (const profile of profiles) {
    const count = counts.get(profile.name);
    if (
      count.generated !== profile.expectedGeneratedCases ||
      count.authored !== profile.expectedAuthoredCases ||
      count.other !== 0
    )
      errors.push(
        new Error(
          `SDK profile ${profile.name}: executed ${JSON.stringify(count)}; expected ${profile.expectedGeneratedCases} generated and ${profile.expectedAuthoredCases} authored cases.`,
        ),
      );
  }
  if (errors.length)
    throw new AggregateError(errors, "Incomplete SDK profile execution.");
}

module.exports = { validatePublicHttpProfiles };
