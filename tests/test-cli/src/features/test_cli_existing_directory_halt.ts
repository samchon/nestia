import { TestValidator } from "@nestia/e2e";

import { CliTestHarness } from "../internal/CliTestHarness";

/**
 * Verifies the scaffolder halts when the destination directory already exists.
 *
 * Cloning into an existing directory would either fail halfway through git or
 * mix template files into user data; the guard must fire before the clone, with
 * the exact message users have relied on since the npm-era CLI.
 *
 * 1. Run `nestia start` with a fake context whose `exists` reports true.
 * 2. Assert it halts with "The target directory already exists.".
 * 3. Assert no command was executed at all.
 *
 * @evidence contracts/testing.md#behavioral-verification The starter receives an existing destination and must halt with the collision message before any recorded command.
 * @evidence contracts/testing.md#independent-expectations The destination-protection contract forbids cloning into an existing path; literal guidance and an empty command list express that result.
 * @evidence contracts/testing.md#distinguishing-cases This case owns existing-path rejection; command-sequence cases supply the absent-path twin.
 * @evidence contracts/testing.md#execution-ownership The test-cli DynamicExecutor discovers this unit export, which calls the built engine with injected context operations; no CLI process, package manager or network connection runs.
 */
export const test_cli_existing_directory_halt = async (): Promise<void> => {
  const fake: CliTestHarness.IFakeContext = CliTestHarness.createFakeContext({
    exists: () => true,
  });
  const reason: string | undefined = await CliTestHarness.expectHalt(() =>
    CliTestHarness.getStarter()(CliTestHarness.halter, fake.context)([
      "my-project",
    ]),
  );

  TestValidator.equals(
    "reason",
    reason,
    "The target directory already exists.",
  );
  TestValidator.equals("commands", fake.commands, []);
};
