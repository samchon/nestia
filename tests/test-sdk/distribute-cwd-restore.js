const cp = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

/**
 * Verifies a failed distribution setup restores the process working directory.
 *
 * Why:
 * Distribution generation changes the process cwd before copying templates and
 * installing dependencies; an exception must not redirect the next feature.
 *
 * 1. Stub the first distribution install to fail after the composer changes cwd.
 * 2. Assert the rejection leaves the caller in its original working directory.
 */
const main = async () => {
  const root = process.cwd();
  const directory = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "nestia-distribute-cwd-"),
  );
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
  const execute = cp.execSync;
  try {
    cp.execSync = () => {
      throw new Error("intentional distribution install failure");
    };
    await composer.compose({
      config: {
        output: path.join(directory, "output"),
        distribute: path.join(directory, "distribute"),
      },
      mcp: false,
      websocket: false,
    });
    throw new Error("distribution compose unexpectedly succeeded.");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "intentional distribution install failure"
    ) {
      if (process.cwd() !== root)
        throw new Error(
          "distribution compose did not restore its working directory.",
        );
      return;
    }
    throw error;
  } finally {
    cp.execSync = execute;
    if (process.cwd() !== root) process.chdir(root);
    await fs.promises.rm(directory, { force: true, recursive: true });
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
