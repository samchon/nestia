const fs = require("fs");
const os = require("os");
const path = require("path");

/**
 * Verifies a failed distribution setup restores the process working directory.
 *
 * Why: Distribution generation changes the process cwd before copying templates
 * and installing dependencies; an exception must not redirect the next
 * feature.
 *
 * 1. Run the actual npm installer offline with a fresh empty owned cache.
 * 2. Assert that distribution first creates the requested nested output root.
 * 3. Assert the rejection leaves the caller in its original working directory.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual distribution composition must create its nested package files, fail its real npm install and restore the caller's working directory.
 * @evidence contracts/testing.md#independent-expectations npm cannot install uncached registry packages in offline mode; the caller's recorded directory and explicitly requested nested output supply independent restoration/location expectations.
 * @evidence contracts/testing.md#distinguishing-cases An empty offline cache isolates the installer failure after successful template creation; neighboring distribution features retain successful installation and compilation.
 * @evidence contracts/testing.md#execution-ownership The SDK runner invokes this exported script main in a separate plain Node process; assertions reject the script and its failure is retained under distribute-cwd-restore.
 * @evidence contracts/e2e.md#necessary-boundary Real npm execution must fail while distribution owns process.cwd; replacing execSync would not establish the actual child-process failure path.
 * @evidence contracts/e2e.md#shared-execution This case consumes the caller-built SDK composer and installed npm once. Successful distribution states share the suite installation/native cache but retain their necessary separate package-install boundaries.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A unique temporary root owns package/cache outputs; offline/cache environment overrides are restored exactly in finally, the original cwd is restored even on assertion failure, and only this root is removed.
 * @evidence contracts/e2e.md#preserved-coverage Nested package creation and exact cwd restoration remain asserted; the former global execSync substitution is replaced by an actual offline npm failure rather than removing the negative control.
 */
const main = async () => {
  const root = process.cwd();
  const directory = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "nestia-distribute-cwd-"),
  );
  const distribute = path.join(directory, "generated", "packages", "api");
  const composer = require(
    path.join(
      root,
      "packages",
      "sdk",
      "lib",
      "generates",
      "internal",
      "SdkDistributionComposer.js",
    ),
  ).SdkDistributionComposer;
  const overrides = {
    npm_config_offline: "true",
    npm_config_cache: path.join(directory, "npm-cache"),
    npm_config_audit: "false",
    npm_config_fund: "false",
  };
  const previous = new Map();
  try {
    for (const [key, value] of Object.entries(overrides)) {
      for (const spelling of [key, key.toUpperCase()]) {
        previous.set(spelling, process.env[spelling]);
      }
      for (const spelling of [key, key.toUpperCase()]) {
        delete process.env[spelling];
      }
      process.env[key] = value;
    }
    await composer.compose({
      config: {
        output: path.join(directory, "output"),
        distribute,
      },
      mcp: false,
      websocket: false,
    });
    throw new Error("distribution compose unexpectedly succeeded.");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("npm install --save-dev") &&
      typeof error.status === "number" &&
      error.status !== 0
    ) {
      if (fs.existsSync(path.join(distribute, "package.json")) === false)
        throw new Error(
          "distribution compose did not create its nested directory.",
        );
      if (process.cwd() !== root)
        throw new Error(
          "distribution compose did not restore its working directory.",
        );
      return;
    }
    throw error;
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    if (process.cwd() !== root) process.chdir(root);
    await fs.promises.rm(directory, { force: true, recursive: true });
  }
};

module.exports = { main };
if (require.main === module)
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
