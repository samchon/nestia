import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getLinkedTypiaVersion } from "../../../../packages/sdk/lib/executable/internal/getLinkedTypiaVersion";

/**
 * Verifies dependency installation selects the native transform's runtime.
 *
 * A range can upgrade the runtime beside core without changing its Go host.
 * Reinstalling that runtime would preserve the incompatibility. The
 * descriptor's pinned release must win without invoking its version-rejecting
 * factory.
 *
 * 1. Resolve pinned metadata beside a different installed runtime.
 * 2. Retain exact-runtime lookup for a legacy descriptor without metadata.
 * 3. Reject malformed declared metadata instead of falling back to the runtime.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual CLI version-selection operation returns authored pinned metadata despite a different installed runtime and a factory that throws if called. A legacy descriptor resolves its authored runtime; malformed metadata rejects.
 * @evidence contracts/testing.md#independent-expectations Distinct literal transform and runtime versions define the desired selection independently of the returned value. The throwing factory establishes that reading metadata must not execute compatibility admission.
 * @evidence contracts/testing.md#distinguishing-cases A ranged upgrade, legacy exact dependency, empty metadata and non-string metadata distinguish native authority, backward compatibility and failure without an unsafe fallback.
 * @evidence contracts/testing.md#execution-ownership The canonical SDK unit population discovers this matching export and calls the built owning operation against contained temporary files. It installs no consumer and starts no compiler, package manager or application.
 */
export function test_sdk_linked_typia_version(): void {
  const temporary = path.resolve(os.tmpdir());
  const root = fs.mkdtempSync(path.join(temporary, "nestia-linked-typia-"));
  const relative = path.relative(temporary, root);
  assert(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
  try {
    const fixture = (name: string, runtime: string, metadata?: unknown) => {
      const installation = path.join(root, name);
      const core = path.join(installation, "node_modules/@nestia/core");
      fs.mkdirSync(path.join(core, "native"), { recursive: true });
      const manifest = path.join(core, "package.json");
      fs.writeFileSync(manifest, JSON.stringify({ name: "@nestia/core" }));
      fs.writeFileSync(
        path.join(core, "native/transform.cjs"),
        `module.exports = function () { throw new Error("Factory must not run"); };${metadata === undefined ? "" : `module.exports.typiaVersion = ${JSON.stringify(metadata)};`}`,
      );
      const typia = path.join(installation, "node_modules/typia");
      fs.mkdirSync(typia, { recursive: true });
      fs.writeFileSync(
        path.join(typia, "package.json"),
        JSON.stringify({ name: "typia", version: runtime }),
      );
      return manifest;
    };
    assert.equal(
      getLinkedTypiaVersion(fixture("ranged", "17.9.0", "17.8.9")),
      "17.8.9",
    );
    assert.equal(getLinkedTypiaVersion(fixture("legacy", "16.4.2")), "16.4.2");
    for (const [name, metadata] of [
      ["empty", ""],
      ["non-string", 17],
    ] as const)
      assert.throws(
        () => getLinkedTypiaVersion(fixture(name, "17.9.0", metadata)),
        /Invalid typia transform version/,
      );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
