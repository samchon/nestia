/**
 * Selects generated-program scenarios before integration preparation starts.
 *
 * The optional --only substring retains the existing selection semantics.
 * Rejecting an empty result prevents a successful fixture CLI from concealing
 * that no generated migration program will be tested.
 *
 * @evidence contracts/common.md#principled-implementation The existing --only substring selects scenario names without changing their records; an empty final population rejects before the caller installs or removes generated outputs.
 * @evidence contracts/common.md#clear-and-simple-design One pure operation combines the existing optional substring with the nonempty execution invariant; the entry retains fixture-only mode and preparation ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Selection uses caller-authored names and arguments, with no fixture-specific predicate, success substitution or persistent preparation stamp.
 * @evidence contracts/common.md#meaningful-documentation The comment explains substring compatibility and why fixture CLI success cannot establish generated-program coverage.
 */
export const selectMigrateScenarios = <T extends { name: string }>(
  scenarios: readonly T[],
  argv: readonly string[],
): T[] => {
  const only = argv.indexOf("--only");
  const substring = only === -1 ? undefined : argv[only + 1];
  const selected = scenarios.filter(
    (scenario) => substring === undefined || scenario.name.includes(substring),
  );
  if (selected.length === 0)
    throw new Error("No migration integration scenarios were selected.");
  return selected;
};
