import fs from "fs";
import path from "path";

import { SDK_BUNDLE_PATH } from "./SdkBundlePath";
import { SourceFinder } from "./SourceFinder";

/**
 * Separates authored TypeScript inputs from files owned by SDK generation.
 *
 * Each filter owns one output directory. Installed bundle metadata is shared;
 * output-specific native paths are never stored in the process-wide cache.
 *
 * @evidence contracts/common.md#principled-implementation Source extensions are checked before generated functional descendants and exact bundled output files are excluded. Native identities and path.relative distinguish descendants from prefix-sharing siblings.
 * @evidence contracts/common.md#clear-and-simple-design One filter factory separates source selection from controller compilation; its private helpers own bundle metadata and filesystem identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exclusions come from the actual installed bundle and the generated functional directory, without fixture names or a cached caller output.
 * @evidence contracts/common.md#meaningful-documentation The comment states filter ownership and the cache's output-independent content.
 * @evidence contracts/portability.md#os-neutral-implementation Native real paths resolve existing ancestors and path.relative judges directory containment; neither OS names nor lowercasing assume a volume's case or link policy.
 * @evidence contracts/performance.md#efficient-algorithms Successful installed bundle entries are scanned once and each filter builds its exclusion roots once; a candidate resolves one identity and compares at most the bundle entry count plus functional root, with no recursive source scan here.
 * @evidence contracts/performance.md#reuse-equivalent-work Concurrent filters share installed bundle names and kinds; a failed metadata read clears the promise so a later request can retry. Output-specific resolved roots belong to each factory call, so another output cannot reuse the first caller's paths.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The one metadata promise retains only the fixed installed bundle population. Output roots live in the returned filter closure and are released with its source-discovery call; there is no growing per-output registry.
 */
export namespace SdkInputFilter {
  /**
   * Creates the source predicate for one configuration's output, or an
   * extension-only predicate when no SDK output is configured.
   *
   * @evidence contracts/common.md#principled-implementation The predicate accepts regular TypeScript source names, excludes descendants of this output's functional directory and the bundle's exact file/directory identities, and leaves same-named authored files outside that output eligible.
   * @evidence contracts/common.md#clear-and-simple-design Output roots are prepared before discovery and captured in one returned predicate, so compilation never owns these path-selection rules.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Every configuration resolves its own output; no first-call output, substring containment or operating-system case guess substitutes for filesystem identity.
   * @evidence contracts/common.md#meaningful-documentation The comment documents both output-bound and extension-only modes.
   * @evidence contracts/portability.md#os-neutral-implementation The nearest existing ancestor carries actual case/link identity and nonexistent suffixes retain their native spelling; path.relative rejects sibling and cross-root locations without protocol-path comparisons.
   * @evidence contracts/performance.md#efficient-algorithms Factory preparation is linear in installed bundle entries and each predicate call scans those prepared roots after one candidate identity resolution. It reuses the discovery traversal rather than walking inputs again.
   * @evidence contracts/performance.md#reuse-equivalent-work Output-independent metadata comes from one shared in-flight or successful promise; rejection clears it for retry, while each output-specific root array is computed for its own factory call and is not shared across incompatible configurations.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The predicate retains only this configuration's fixed exclusion roots and no candidate history; once SourceFinder finishes, that closure has no persistent owner.
   */
  export const create = async (
    output: string | undefined,
  ): Promise<(location: string) => Promise<boolean>> => {
    if (output === undefined)
      return async (location) => SourceFinder.isTypeScriptSource(location);
    const excluded = [
      {
        location: identity(path.resolve(output, "functional")),
        directory: true,
      },
      ...(await bundle()).map((asset) => ({
        location: identity(path.resolve(output, asset.name)),
        directory: asset.directory,
      })),
    ];
    return async (location) => {
      if (SourceFinder.isTypeScriptSource(location) === false) return false;
      const file = identity(location);
      return excluded.every((entry) =>
        entry.directory
          ? within(entry.location, file) === false
          : entry.location !== file,
      );
    };
  };
}

let bundlePromise: Promise<{ name: string; directory: boolean }[]> | undefined;
const bundle = (): Promise<{ name: string; directory: boolean }[]> => {
  if (bundlePromise === undefined)
    bundlePromise = (async () =>
      Promise.all(
        (
          await fs.promises.readdir(SDK_BUNDLE_PATH, { withFileTypes: true })
        ).map(async (entry) => ({
          name: entry.name,
          directory: entry.isSymbolicLink()
            ? (
                await fs.promises.stat(path.join(SDK_BUNDLE_PATH, entry.name))
              ).isDirectory()
            : entry.isDirectory(),
        })),
      ))().catch((error) => {
      bundlePromise = undefined;
      throw error;
    });
  return bundlePromise;
};

const within = (directory: string, location: string): boolean => {
  const relative = path.relative(directory, location);
  return (
    relative === "" ||
    (path.isAbsolute(relative) === false &&
      relative !== ".." &&
      relative.startsWith(`..${path.sep}`) === false)
  );
};

const identity = (location: string): string => {
  const rest: string[] = [];
  for (let current = path.resolve(location); ; ) {
    try {
      return path.join(fs.realpathSync.native(current), ...rest.reverse());
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const parent = path.dirname(current);
      if (parent === current) throw error;
      rest.push(path.basename(current));
      current = parent;
    }
  }
};
