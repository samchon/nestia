import fs from "fs";
import path from "path";

/**
 * Owns unique temporary directories created by this SDK process.
 *
 * Shared parent directories are never registered for deletion. Configuration
 * modules and runtime modules use the same registry and termination hook, so
 * one process cannot sweep another process's live compiler inputs.
 *
 * @evidence contracts/common.md#principled-implementation Only mkdtemp results created by this process enter the registry; cleanup visits those exact directories and leaves shared parents and sibling processes' directories alone.
 * @evidence contracts/common.md#clear-and-simple-design Creation and explicit release share one private registry and one exit/signal hook for configuration and runtime materialization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ownership is established by creation rather than a directory-name pattern, process ID guess or sweeping the entire project cache.
 * @evidence contracts/common.md#meaningful-documentation The comment defines ownership, shared-parent preservation and why both compiler paths use one registry.
 * @evidence contracts/portability.md#os-neutral-implementation Node fs/path operations create and remove native paths. The shared hook sweeps all registered directories before re-raising a termination signal; abrupt OS termination can bypass JavaScript cleanup.
 * @evidence contracts/performance.md#efficient-algorithms Set membership and registration are constant-time on average; a termination sweep visits each retained directory once and removal costs the owned subtree's filesystem entries. Shared parents are never scanned.
 * @evidence contracts/performance.md#reuse-equivalent-work Configuration and runtime materializers share the same registry and once-installed exit/signal hooks. Each child has distinct contents and ownership, so allocations and deletions themselves are not substituted by a cached path.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The registry retains one path per unreleased materialization; explicit release forgets it and process termination sweeps the remainder. Failed removals are reported and cause a failing exit rather than hiding them.
 */
export namespace TemporaryDirectory {
  /**
   * Creates and registers an owned child under a possibly shared parent.
   *
   * @evidence contracts/common.md#principled-implementation mkdir establishes the parent and mkdtemp creates an exclusive child before its path is registered, so concurrent processes never acquire ownership of the same directory.
   * @evidence contracts/common.md#clear-and-simple-design The function creates one child and registers the shared cleanup hook once.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The random child is allocated by the filesystem; no shared parent is eligible for cleanup and existing signal listeners do not suppress this registration.
   * @evidence contracts/common.md#meaningful-documentation The comment states that the returned child is owned and its parent may be shared.
   * @evidence contracts/portability.md#os-neutral-implementation Node mkdir/mkdtemp and path.join operate on filesystem paths supplied by the materializers; no URL spelling, separator literal or OS-specific shell creates the child. Signal delivery remains best effort under abrupt termination.
   * @evidence contracts/performance.md#efficient-algorithms The function makes one filesystem allocation and one average constant-time Set insertion; parent creation follows its path depth, and the fixed termination hooks are installed only on the first allocation.
   * @evidence contracts/performance.md#reuse-equivalent-work All create calls reuse the one cleanup-hook registration. Directory allocations cannot be shared because each compiler materialization needs independent mutable contents and deletion ownership.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Each returned child transfers its contents to the caller while its path remains registered until explicit remove or process termination. Retention grows with unreleased materializations; process exit bounds the registry lifetime but a long-running process has no independent byte/count limit.
   */
  export const create = (parent: string, prefix: string): string => {
    fs.mkdirSync(parent, { recursive: true });
    const directory: string = fs.mkdtempSync(path.join(parent, prefix));
    owned.add(directory);
    if (!registered) {
      registered = true;
      process.once("exit", sweep);
      for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const)
        process.once(signal, () => {
          sweep();
          process.kill(process.pid, signal);
        });
    }
    return directory;
  };

  /**
   * Releases a registered child early; an unowned path is rejected.
   *
   * @evidence contracts/common.md#principled-implementation Registry membership is required before recursive removal, and ownership is forgotten only after removal succeeds; an arbitrary or already released path cannot be deleted through this operation.
   * @evidence contracts/common.md#clear-and-simple-design One membership guard, one removal and one registry deletion own explicit release.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It never broadens the requested deletion to the parent and does not swallow filesystem errors.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies early release and rejection of unowned paths.
   * @evidence contracts/portability.md#os-neutral-implementation The returned native path is an ownership token checked by exact Set membership before Node recursive removal; alternate spellings are rejected rather than guessing filesystem case identity or invoking a platform shell.
   * @evidence contracts/performance.md#efficient-algorithms One average constant-time ownership lookup/deletion surrounds removal proportional to that child's filesystem subtree; siblings and shared parents are neither enumerated nor removed.
   * @evidence contracts/performance.md#reuse-equivalent-work A deletion is a one-time ownership-consuming effect, not a reusable computation. Explicit releases unregister children so the shared termination sweep does not repeat their removals.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Successful removal releases contents and registry identity together; a failed removal retains ownership for later cleanup and propagates the error. Termination cleanup attempts other retained children and reports failures.
   */
  export const remove = (directory: string): void => {
    if (!owned.has(directory))
      throw new Error(`Unowned temporary directory: ${directory}`);
    fs.rmSync(directory, { recursive: true, force: true });
    owned.delete(directory);
  };
}

const owned: Set<string> = new Set();
let registered = false;
const sweep = (): void => {
  for (const directory of owned)
    try {
      TemporaryDirectory.remove(directory);
    } catch (error) {
      process.stderr.write(
        `Failed to remove SDK temporary directory: ${String(error)}\n`,
      );
      process.exitCode = 1;
    }
};
