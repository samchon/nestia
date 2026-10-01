const assert = require("node:assert/strict");
const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Verifies an actual failed distribution installer preserves the caller state.
 *
 * A fresh empty offline npm cache forces failure after template creation, so a
 * resolver failure cannot masquerade as the intended installer failure. One
 * child realm isolates process environment and cwd from the shared rich runner.
 *
 * 1. Call the distribution composer from the same packed SDK in a real child.
 * 2. Require an offline npm failure after the nested package has been created.
 * 3. Verify the exact caller cwd and environment restoration and await close.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual SdkDistributionComposer.compose must create nested package.json before its npm install --save-dev returns nonzero. Its caller cwd must remain identical. A signal, resolver failure or inability to launch npm cannot pass as the installer verdict.
 * @evidence contracts/testing.md#independent-expectations A newly created empty cache cannot supply the registry dependencies offline. The explicitly requested nested path, recorded original cwd and original environment values establish independent expectations without deriving them from composer output.
 * @evidence contracts/testing.md#distinguishing-cases Template creation is the positive control preceding the actual installer negative. The command and status distinguish installer failure from earlier dependency resolution failure. Caller cwd and finally-restored environment are both required; successful distribution installation remains a separate pending original case.
 * @evidence contracts/testing.md#execution-ownership The sole E2E entry invokes this matching export after shared installation. It awaits the actual Node child's close and propagates its failure through the entry's independent named case aggregation.
 * @evidence contracts/e2e.md#necessary-boundary The installed composer launches actual npm and must preserve caller process state when that child fails. No child_process method, npm method or production loader is replaced.
 * @evidence contracts/e2e.md#shared-execution The existing packed installation supplies the SDK and dependency inventory. One isolated Node child and one failing installer attempt are additional preparation; no additional pack, completed install, compiler or backend is created.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A unique rich sandbox directory owns the output and empty cache. Only the child overrides offline/cache/audit/fund environment. Both lowercase and uppercase original values are recorded before deletion and restored in finally. Parent cwd and environment remain untouched; parent teardown removes files after child close.
 * @evidence contracts/e2e.md#preserved-coverage Original distribute-cwd-restore assertions retain actual offline nonzero install, nested package creation and exact cwd preservation. Windows npm-cli.js and POSIX npm retain the same install argv contract. This failure case does not replace the still-pending successful distribution package compilation.
 */
const test_sdk_distribution_cwd_restore = async ({
  installation,
  sandbox,
  record,
}) => {
  const directory = path.join(sandbox, "sdk-distribution-cwd");
  fs.mkdirSync(directory);
  const manifest = require.resolve("@nestia/sdk/package.json", {
    paths: [installation.directory],
  });
  const composer = path.join(
    path.dirname(manifest),
    "lib/generates/internal/SdkDistributionComposer.js",
  );
  const result = await new Promise((resolve, reject) => {
    const child = cp.spawn(
      process.execPath,
      [__filename, composer, directory],
      {
        cwd: sandbox,
        windowsHide: true,
        env: { ...process.env },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let output = "";
    for (const stream of [child.stdout, child.stderr]) {
      stream.setEncoding("utf8");
      stream.on("data", (chunk) => {
        output = (output + chunk).slice(-65536);
      });
    }
    child.once("error", reject);
    child.once("close", (code, signal) => resolve({ code, signal, output }));
  });
  record?.("sdk-distribution-cwd.json", {
    ...result,
    childRealms: 1,
    installerAttempts: result.code === 0 ? 1 : null,
  });
  assert.equal(result.signal, null, result.output);
  assert.equal(result.code, 0, result.output);
};

// This child body belongs to the exported boundary operation above. It uses
// actual installed methods; the parent never changes its own cwd/environment.
const exercise = async (composerPath, directory) => {
  const root = process.cwd();
  const distribute = path.join(directory, "generated/packages/api");
  const cache = path.join(directory, "npm-cache");
  fs.mkdirSync(cache);
  assert.deepEqual(fs.readdirSync(cache), []);
  const overrides = {
    npm_config_offline: "true",
    npm_config_cache: cache,
    npm_config_audit: "false",
    npm_config_fund: "false",
  };
  const previous = new Map();
  try {
    for (const [key, value] of Object.entries(overrides)) {
      for (const spelling of [key, key.toUpperCase()]) {
        previous.set(spelling, process.env[spelling]);
      }
      for (const spelling of [key, key.toUpperCase()])
        delete process.env[spelling];
      process.env[key] = value;
    }
    const composer = require(composerPath).SdkDistributionComposer;
    await assert.rejects(
      () =>
        composer.compose({
          config: { output: path.join(directory, "output"), distribute },
          mcp: false,
          websocket: false,
        }),
      (error) => {
        assert.equal(
          typeof error.status,
          "number",
          "Expected an actual installer exit.",
        );
        assert.notEqual(error.status, 0);
        assert.equal(
          error.signal,
          null,
          "A killed installer is not the offline verdict.",
        );
        assert.match(error.message, /\binstall --save-dev\b/);
        assert.match(error.message, /npm(?:-cli\.js)?/);
        return true;
      },
    );
    assert(
      fs.existsSync(path.join(distribute, "package.json")),
      "Nested package was not created before installer failure.",
    );
    assert.equal(
      process.cwd(),
      root,
      "Distribution changed the caller cwd on failure.",
    );
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    if (process.cwd() !== root) process.chdir(root);
  }
  for (const [key, value] of previous) assert.equal(process.env[key], value);
  assert.equal(process.cwd(), root);
};

module.exports = { test_sdk_distribution_cwd_restore };
if (require.main === module)
  exercise(process.argv[2], process.argv[3]).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
