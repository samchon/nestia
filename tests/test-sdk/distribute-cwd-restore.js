const fs = require("fs");
const path = require("path");

/**
 * Verifies a failed distribution setup restores the process working directory.
 *
 * Why: An actual failed package installation must not redirect the next
 * feature's working directory. Offline npm with an empty private cache supplies
 * the failure without replacing any package-manager or process methods.
 *
 * 1. Run distribution installation offline with an empty private npm cache.
 * 2. Assert that distribution first creates the requested nested output root.
 * 3. Assert the rejection leaves the caller in its original working directory.
 */
const main = async () => {
  const root = process.cwd();
  const cache = path.join(root, "node_modules", ".cache", "test-sdk");
  await fs.promises.mkdir(cache, { recursive: true });
  const directory = await fs.promises.mkdtemp(
    path.join(cache, "nestia-distribute-cwd-"),
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
  const previous = {
    npm_config_offline: process.env.npm_config_offline,
    npm_config_cache: process.env.npm_config_cache,
  };
  try {
    process.env.npm_config_offline = "true";
    process.env.npm_config_cache = path.join(directory, "npm-cache");
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
      Number.isInteger(error.status) &&
      error.status !== 0
    ) {
      if (fs.existsSync(distribute) === false)
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
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    if (process.cwd() !== root) process.chdir(root);
    await fs.promises.rm(directory, { force: true, recursive: true });
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
