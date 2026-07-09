import { TestValidator } from "@nestia/e2e";

import { CliTestHarness } from "../internal/CliTestHarness";

/**
 * Verifies the scaffolder halts with installation guidance when neither pnpm
 * nor corepack is available.
 *
 * Falling through to npm — the old behavior — would hard-fail deep inside `npm
 * install` with a cryptic `catalog:` protocol error. Halting before any install
 * attempt, with a message telling the user how to get pnpm, is the contract
 * this test pins down.
 *
 * 1. Run `nestia start` with a fake context where every probe fails.
 * 2. Assert the command halts and the message names pnpm and corepack.
 * 3. Assert no package manager command was ever executed.
 */
export const test_cli_package_manager_missing_halt =
  async (): Promise<void> => {
    const fake: CliTestHarness.IFakeContext = CliTestHarness.createFakeContext({
      probe: () => false,
    });
    const reason: string | undefined = await CliTestHarness.expectHalt(() =>
      CliTestHarness.getStarter()(CliTestHarness.halter, fake.context)([
        "my-project",
      ]),
    );

    TestValidator.predicate(
      "guidance",
      reason !== undefined &&
        reason.includes("pnpm") &&
        reason.includes("corepack"),
    );
    TestValidator.equals("commands", fake.commands, [
      `git clone "https://github.com/samchon/nestia-start" "my-project"`,
    ]);
  };
