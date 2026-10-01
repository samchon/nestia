import { TestValidator } from "@nestia/e2e";

import { CliTestHarness } from "./internal/CliTestHarness";

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
 *
 * @evidence contracts/testing.md#behavioral-verification It runs `nestia start` where every probe fails and asserts the halt names pnpm and corepack and that no package manager command ran, which detects a fall-through to npm.
 * @evidence contracts/testing.md#independent-expectations npm cannot resolve the `catalog:` protocol, so halting with installation guidance is the contract, and the words are asserted literally.
 * @evidence contracts/testing.md#distinguishing-cases All probes failing is the negative case beside pnpm-present and corepack-only.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process discovered by `DynamicExecutor`, loading the built `NestiaStarter`/`NestiaTemplate` engine of `packages/cli` by absolute path and driving it with a fake context that records every command, probe, directory change, and removal; no git, package manager, or network is touched, and the real executable is owned by `test-boundaries`.
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
      {
        executable: "git",
        args: [
          "clone",
          "https://github.com/samchon/nestia-start",
          "my-project",
        ],
      },
    ]);
  };
