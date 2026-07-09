import { TestValidator } from "@nestia/e2e";

import { CliTestHarness } from "../internal/CliTestHarness";

/**
 * Verifies the `--repository <url>` option replaces the default template
 * repository URL.
 *
 * The override exists for forks and for network-free end-to-end testing of the
 * CLI itself; if argument parsing regressed, the flag (or its value) could be
 * mistaken for the destination directory, or the default URL could be cloned
 * regardless of the user's choice.
 *
 * 1. Run `nestia start` with `--repository` pointing at a fork URL.
 * 2. Assert the clone command uses the fork URL instead of the default.
 * 3. Assert the destination directory is still parsed correctly.
 * 4. Assert a `--repository` flag without a value halts with guidance.
 */
export const test_cli_repository_option_override = async (): Promise<void> => {
  const url: string = "https://github.com/someone/nestia-start-fork";
  const fake: CliTestHarness.IFakeContext = CliTestHarness.createFakeContext();
  await CliTestHarness.getStarter()(CliTestHarness.halter, fake.context)([
    "my-project",
    "--repository",
    url,
  ]);

  TestValidator.equals(
    "clone",
    fake.commands[0],
    `git clone "${url}" "my-project"`,
  );
  TestValidator.equals("chdir", fake.chdirs, ["my-project"]);

  const reason: string | undefined = await CliTestHarness.expectHalt(() =>
    CliTestHarness.getStarter()(
      CliTestHarness.halter,
      CliTestHarness.createFakeContext().context,
    )(["my-project", "--repository"]),
  );
  TestValidator.predicate(
    "missing value",
    reason !== undefined && reason.includes("--repository"),
  );
};
