import { TestValidator } from "@nestia/e2e";

import { CliTestHarness } from "./internal/CliTestHarness";

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
 *
 * @evidence contracts/testing.md#behavioral-verification It runs `nestia start` with `--repository <fork>` and asserts the clone uses the fork and the destination is parsed correctly, and that a `--repository` without a value halts.
 * @evidence contracts/testing.md#independent-expectations The fork URL is the input and appears verbatim in the recorded clone command.
 * @evidence contracts/testing.md#distinguishing-cases A given override, the parsed destination, and a missing value are three separate assertions.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process discovered by `DynamicExecutor`, loading the built `NestiaStarter`/`NestiaTemplate` engine of `packages/cli` by absolute path and driving it with a fake context that records every command, probe, directory change, and removal; no git, package manager, or network is touched, and the real executable is owned by `test-boundaries`.
 */
export const test_cli_repository_option_override = async (): Promise<void> => {
  const url: string = "https://github.com/someone/nestia-start-fork";
  const fake: CliTestHarness.IFakeContext = CliTestHarness.createFakeContext();
  await CliTestHarness.getStarter()(CliTestHarness.halter, fake.context)([
    "my-project",
    "--repository",
    url,
  ]);

  TestValidator.equals("clone", fake.commands[0], {
    executable: "git",
    args: ["clone", url, "my-project"],
  });
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
