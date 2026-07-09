import { TestValidator } from "@nestia/e2e";

import { CliTestHarness } from "../internal/CliTestHarness";

/**
 * Verifies the scaffolder falls back to `corepack pnpm` when pnpm is not
 * directly installed.
 *
 * Node.js bundles corepack, so most machines without a global pnpm can still
 * resolve the `catalog:` protocol through it — but only if the CLI both
 * prefixes every lifecycle command with `corepack pnpm` and suppresses the
 * interactive download prompt that would otherwise hang a non-interactive
 * scaffold.
 *
 * 1. Run `nestia start` with a fake context where only `corepack --version` probes
 *    successfully.
 * 2. Assert install/build/test commands are prefixed with `corepack pnpm`.
 * 3. Assert `COREPACK_ENABLE_DOWNLOAD_PROMPT` is set to `"0"`.
 */
export const test_cli_package_manager_corepack_fallback =
  async (): Promise<void> => {
    const original: string | undefined =
      process.env.COREPACK_ENABLE_DOWNLOAD_PROMPT;
    delete process.env.COREPACK_ENABLE_DOWNLOAD_PROMPT;
    try {
      const fake: CliTestHarness.IFakeContext =
        CliTestHarness.createFakeContext({
          probe: (command) => command.startsWith("corepack"),
        });
      await CliTestHarness.getStarter()(CliTestHarness.halter, fake.context)([
        "my-project",
      ]);

      TestValidator.equals("probes", fake.probes, [
        "pnpm --version",
        "corepack --version",
      ]);
      TestValidator.equals("commands", fake.commands.slice(1), [
        "corepack pnpm install",
        "corepack pnpm run build",
        "corepack pnpm run test",
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
