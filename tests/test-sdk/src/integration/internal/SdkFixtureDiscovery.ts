import fs from "node:fs";
import path from "node:path";

/**
 * Discovers configured source fixtures, excluding generated directory remnants.
 *
 * The caller supplies the same configuration filename used for execution. Each
 * command reads current directory contents; no previous discovery survives
 * source removal or creation. Missing roots and unreadable inputs remain
 * errors.
 *
 * @evidence contracts/common.md#principled-implementation Only directories with their execution configuration file are fixtures. A leftover node_modules or output directory cannot independently define a source test; real configured error fixtures remain enrolled.
 * @evidence contracts/common.md#clear-and-simple-design One directory scan and the caller's existing configuration-name policy produce sorted fixture names. The operation starts no preparation and retains no cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Filesystem discovery uses real config files, without a retired-name blacklist or Git-dependent selection. It does not suppress generator or malformed-config failures.
 * @evidence contracts/common.md#meaningful-documentation The comment states the source boundary, caller-owned filename policy and current-input/error behavior.
 * @evidence contracts/portability.md#os-neutral-implementation Native directory entries and path.join represent actual filesystem paths. No shell enumeration, platform spelling or case-policy assumption is used.
 */
export function discoverSdkFixtures(
  root: string,
  configurationName: (name: string) => string,
): string[] {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".tmp-"))
    .filter((entry) => {
      const config = path.join(root, entry.name, configurationName(entry.name));
      try {
        return fs.statSync(config).isFile();
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "ENOENT"
        )
          return false;
        throw error;
      }
    })
    .map((entry) => entry.name)
    .sort();
}

/**
 * Rejects an empty execution plan before package or fixture preparation.
 *
 * Discovery itself may legitimately find no configured directories; the final
 * plan also contains synthetic cohorts and applies command-line filtering. Only
 * that final population establishes whether the command runs any tests.
 *
 * @evidence contracts/common.md#principled-implementation A successful SDK test command requires at least one selected execution owner. Checking the final plan includes synthetic owners and catches filtering or sharding that selects nothing.
 * @evidence contracts/common.md#clear-and-simple-design The guard validates only the final population and leaves discovery, selection and preparation with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty execution throws rather than manufacturing a passing feature or suppressing an actual failure. No particular fixture name receives special handling.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes valid empty filesystem discovery from invalid empty test execution and identifies the preparation boundary.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation This operation inspects an array length and creates an Error; it owns no filesystem or process boundary.
 */
export function assertSdkFeaturesSelected(names: readonly string[]): void {
  if (names.length === 0)
    throw new Error(
      "No test-sdk features selected. Check --only, --from or --shard.",
    );
}
