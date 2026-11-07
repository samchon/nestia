import fs from "fs";
import path from "path";

/**
 * Returns the runtime release linked into the selected core package's Go host.
 *
 * New descriptors publish that release independently of the installed runtime,
 * so the dependencies command can repair an upgrade admitted by a range. Older
 * descriptors lack this metadata and retain their exact-dependency lookup.
 * Reading the exported value never executes the descriptor factory or its
 * guard.
 *
 * @evidence contracts/common.md#principled-implementation The selected installed core descriptor supplies its pinned transform release. Only legacy descriptors without that field fall back to their resolved runtime manifest; malformed declared metadata rejects instead of selecting an incompatible installed version.
 * @evidence contracts/common.md#clear-and-simple-design One operation owns descriptor metadata admission and the legacy manifest fallback, replacing the CLI's assumption that every dependency is exact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinary Node module resolution and manifest reads supply the version. The descriptor factory is not executed, and no resolver, package manager or installed module is patched.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes pinned transform metadata from legacy runtime lookup and explains why the guard factory stays unexecuted.
 * @evidence contracts/portability.md#os-neutral-implementation Native path.dirname and path.join locate the descriptor from the caller-resolved core manifest; Node resolution anchors the legacy runtime to that installed core on Windows and POSIX without shell parsing.
 */
export function getLinkedTypiaVersion(corePackageFile: string): string {
  const core = path.dirname(corePackageFile);
  const descriptor = require(path.join(core, "native/transform.cjs"));
  const version =
    "typiaVersion" in descriptor
      ? descriptor.typiaVersion
      : JSON.parse(
          fs.readFileSync(
            require.resolve("typia/package.json", { paths: [core] }),
            "utf8",
          ),
        ).version;
  if (typeof version !== "string" || version.length === 0)
    throw new Error(`Invalid typia transform version for ${corePackageFile}.`);
  return version;
}
