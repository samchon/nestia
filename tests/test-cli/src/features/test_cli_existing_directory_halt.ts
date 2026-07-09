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
