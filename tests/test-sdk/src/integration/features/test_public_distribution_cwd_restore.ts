import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

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
 *
 * @evidence contracts/testing.md#behavioral-verification The installed distribution composer must reject the actual offline empty-cache installation, create its nested distribution root and restore the original working directory.
 * @evidence contracts/testing.md#independent-expectations An empty offline npm cache cannot install the requested packages; the caller's captured cwd and authored nested path establish the expected cleanup and preparation independently of generated files.
 * @evidence contracts/testing.md#distinguishing-cases Completed nonzero installation failure is distinguished from launch errors and unexpected success. Both nested directory creation and restored cwd are required before accepting the intended rejection.
 * @evidence contracts/testing.md#execution-ownership The SDK integration owner invokes this matching TypeScript case in its isolated process because the actual operation temporarily changes cwd. It starts no compiler program or HTTP host.
 * @evidence contracts/e2e.md#necessary-boundary An actual npm installation failure crosses the distribution composer's process and cwd boundaries; direct parser or native option units cannot establish its finally cleanup.
 * @evidence contracts/e2e.md#shared-execution The already installed public SDK supplies the composer and dependencies; only a unique empty npm cache is prepared for the necessary rejection.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity An isolated child owns cwd and npm environment changes. Finally restores captured values and removes only the unique created test directory.
 * @evidence contracts/e2e.md#preserved-coverage The original completed failure, nested directory existence and restored cwd assertions all execute unchanged through ordinary installed dependency resolution.
 */
export const test_public_distribution_cwd_restore = async (
  consumerRoot: string,
): Promise<void> => {
  const root = process.cwd();
  const cache = path.join(root, "node_modules", ".cache", "test-sdk");
  await fs.promises.mkdir(cache, { recursive: true });
  const directory = await fs.promises.mkdtemp(
    path.join(cache, "nestia-distribute-cwd-"),
  );
  const distribute = path.join(directory, "generated", "packages", "api");
  const requirePublic = createRequire(path.join(consumerRoot, "package.json"));
  const manifest = requirePublic.resolve("@nestia/sdk/package.json");
  const composer = requirePublic(
    path.join(
      path.dirname(manifest),
      "lib/generates/internal/SdkDistributionComposer.js",
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
      "status" in error &&
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

if (require.main === module || process.argv[1] === __filename)
  test_public_distribution_cwd_restore(process.argv[2] ?? "").catch(
    (error: unknown) => {
      console.error(error);
      process.exit(1);
    },
  );
