import { TestValidator } from "@nestia/e2e";

import { CliTestHarness } from "./internal/CliTestHarness";

/**
 * Verifies the scaffolder falls back to `corepack pnpm` when pnpm is not
 * directly installed.
 *
 * An installed corepack can supply pnpm when pnpm is not directly available and
 * resolve the `catalog:` protocol — but only if the CLI both prefixes every
 * lifecycle command with `corepack pnpm` and suppresses the interactive
 * download prompt that would otherwise hang a non-interactive scaffold.
 *
 * 1. Run `nestia start` with a fake context where only `corepack --version` probes
 *    successfully.
 * 2. Assert install/build/test commands are prefixed with `corepack pnpm`.
 * 3. Assert `COREPACK_ENABLE_DOWNLOAD_PROMPT` is set to `"0"`.
 *
 * @evidence contracts/testing.md#behavioral-verification It runs `nestia start` where only `corepack --version` probes true and asserts install, build, and test are prefixed with `corepack pnpm` and the download prompt variable is `0`.
 * @evidence contracts/testing.md#independent-expectations The prefix and the variable are what the corepack contract requires for a non-interactive run and are written literally.
 * @evidence contracts/testing.md#distinguishing-cases The corepack-only probe is the adjacent case to the pnpm-present sequence and the every-probe-fails halt.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-nestia` process discovered by `DynamicExecutor`, loading the built `NestiaStarter`/`NestiaTemplate` engine of `packages/cli` by absolute path and driving it with a fake context that records every command, probe, directory change, and removal; no git, package manager, or network is touched, and the real executable is owned by `test-boundaries`.
 */
export const test_cli_package_manager_corepack_fallback =
  async (): Promise<void> => {
    const original: string | undefined =
      process.env.COREPACK_ENABLE_DOWNLOAD_PROMPT;
    delete process.env.COREPACK_ENABLE_DOWNLOAD_PROMPT;
    try {
      const fake: CliTestHarness.IFakeContext =
        CliTestHarness.createFakeContext({
          probe: (invocation) => invocation.executable === "corepack",
        });
      await CliTestHarness.getStarter()(CliTestHarness.halter, fake.context)([
        "my-project",
      ]);

      TestValidator.equals("probes", fake.probes, [
        { executable: "pnpm", args: ["--version"] },
        { executable: "corepack", args: ["--version"] },
      ]);
      TestValidator.equals("commands", fake.commands.slice(1), [
        { executable: "corepack", args: ["pnpm", "install"] },
        { executable: "corepack", args: ["pnpm", "run", "build"] },
        { executable: "corepack", args: ["pnpm", "run", "test"] },
      ]);
      TestValidator.equals<string | undefined>(
        "prompt",
        "0",
        process.env.COREPACK_ENABLE_DOWNLOAD_PROMPT,
      );
    } finally {
      if (original === undefined)
        delete process.env.COREPACK_ENABLE_DOWNLOAD_PROMPT;
      else process.env.COREPACK_ENABLE_DOWNLOAD_PROMPT = original;
    }
  };
