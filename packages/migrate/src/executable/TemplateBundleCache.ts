import crypto from "node:crypto";
import fs from "node:fs";

/**
 * Reuses a complete template generation only while its inputs and outputs
 * match.
 *
 * The caller owns the generated paths and cold generation. This module owns the
 * validity manifest; failed generation never publishes a new manifest.
 * Concurrent generation of the same output paths is not supported.
 *
 * @evidence contracts/common.md#principled-implementation Input identity includes the cache implementation and caller-supplied generator inputs. Reuse requires every expected output's current SHA-256 to match the manifest; a missing, changed or partial generation cannot authorize reuse.
 * @evidence contracts/common.md#clear-and-simple-design One operation checks a manifest, delegates cold generation and publishes its successful output digests. The caller retains template-specific fetching and stamping rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Generated contents are never replaced by expected answers. Invalid metadata is treated as a cache miss and failed generation remains a rejection.
 * @evidence contracts/common.md#meaningful-documentation Documents manifest ownership, failed publication and the existing single-writer premise.
 * @evidence contracts/performance.md#efficient-algorithms A hit hashes each output once, with time proportional to input/output bytes and one manifest rather than scanning template trees or fetching Git history.
 * @evidence contracts/performance.md#reuse-equivalent-work The cache implementation, caller inputs and current output digests jointly establish reuse validity; changed inputs, edited outputs and missing files invalidate it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each output set owns one replaceable manifest, not per-run history. Synchronous reads and awaited writes close their file handles. The caller must serialize writers to the same paths.
 * @evidence contracts/portability.md#os-neutral-implementation Node fs consumes caller-owned native paths; identity hashes bytes and never assumes timestamp resolution, case folding or path separators.
 */
export const run = async ({
  inputs,
  outputs,
  stampFile,
  generate,
}: {
  inputs: readonly unknown[];
  outputs: readonly string[];
  stampFile: string;
  generate: () => Promise<void>;
}): Promise<boolean> => {
  const digest = (content: string | Buffer): string =>
    crypto.createHash("sha256").update(content).digest("hex");
  const input = digest(
    JSON.stringify([fs.readFileSync(__filename, "utf8"), inputs]),
  );
  let stamp: { input?: string; outputs?: string[] } | undefined;
  if (fs.existsSync(stampFile)) {
    try {
      stamp = JSON.parse(fs.readFileSync(stampFile, "utf8"));
    } catch {
      // Invalid or interrupted metadata cannot authorize reuse.
    }
  }
  if (
    outputs.length !== 0 &&
    stamp?.input === input &&
    outputs.every(
      (file, index) =>
        fs.existsSync(file) &&
        stamp.outputs?.[index] === digest(fs.readFileSync(file)),
    )
  )
    return true;
  await generate();
  await fs.promises.writeFile(
    stampFile,
    JSON.stringify({
      input,
      outputs: outputs.map((file) => digest(fs.readFileSync(file))),
    }),
    "utf8",
  );
  return false;
};
