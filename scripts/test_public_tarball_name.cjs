const assert = require("node:assert/strict");
const { test } = require("node:test");
const { publicTarballName } = require("./prepare-public-consumer.cjs");

/**
 * Verifies packed bytes determine the public package dependency address.
 *
 * Repacking a changed package at the same version and filename allowed pnpm to
 * keep old installed code. Artifact identity must distinguish changed bytes
 * while retaining reuse for equal bytes and separating package basenames.
 *
 * 1. Require independently published SHA-256 vectors for empty and abc bytes.
 * 2. Compare copied, mutated, appended and distinct-package archive inputs.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual archive-name owner changes dependency addresses for changed contents and distinct packages, while equal copied bytes retain the same address.
 * @evidence contracts/testing.md#independent-expectations Literal SHA-256 empty and abc vectors establish exact expected digests independently of the implementation; byte mutation and length changes must invalidate a content-addressed dependency.
 * @evidence contracts/testing.md#distinguishing-cases Empty and singleton inputs, equal copied buffers, a one-byte mutation, an appended zero byte and a different package basename distinguish byte identity from filename/version-only reuse and encoding loss.
 * @evidence contracts/testing.md#execution-ownership The canonical root Node unit entry discovers this matching test function and calls the pure owner directly with authored buffers; no installation, compilation, filesystem or process boundary executes.
 */
function test_public_tarball_name() {
  assert.equal(
    publicTarballName("sdk", Buffer.alloc(0)),
    "sdk-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.tgz",
  );
  const abc = Buffer.from("abc");
  const expected =
    "sdk-ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad.tgz";
  assert.equal(publicTarballName("sdk", abc), expected);
  assert.equal(publicTarballName("sdk", Buffer.from(abc)), expected);
  assert.notEqual(publicTarballName("sdk", Buffer.from("abd")), expected);
  assert.notEqual(
    publicTarballName("sdk", Buffer.from([97, 98, 99, 0])),
    expected,
  );
  assert.notEqual(
    publicTarballName("sdk", Buffer.from([0])),
    publicTarballName("sdk", Buffer.alloc(0)),
  );
  assert.notEqual(publicTarballName("core", abc), expected);
}

module.exports = { test_public_tarball_name };
if (require.main === module)
  test("test_public_tarball_name", test_public_tarball_name);
