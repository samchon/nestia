import { TestValidator } from "@nestia/e2e";

import { CliTestHarness } from "./internal/CliTestHarness";

/**
 * Verifies the scaffolder refuses a destination or repository that starts with
 * a dash, which `git clone` would read as an option.
 *
 * The clone command is an argument vector with no `--` separator, so `-x` as
 * the destination or `-oProxyCommand=...` as the repository changes what git
 * does. Both are refused before anything runs, while dashes inside a value stay
 * legal.
 *
 * 1. Run the starter with a destination, then a repository, beginning with a dash.
 * 2. Assert each halts with the dash message and records no command.
 * 3. Run values that merely contain a dash and assert they clone as before.
 *
 * @evidence contracts/testing.md#behavioral-verification The built scaffolder is driven with a recording context, so a refused value is proven by the halt reason together with an empty command list, which a check after the clone would not give.
 * @evidence contracts/testing.md#independent-expectations Git treats an argument starting with a dash as an option, so the refusal set follows from git's documented argument syntax, and the accepted values are the ordinary names the command sequence tests already use.
 * @evidence contracts/testing.md#distinguishing-cases A leading-dash destination and a leading-dash repository are the negatives, a destination with an inner dash and a repository URL with dashes are the adjacent positives, and a single dash alone is the boundary.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared test-nestia process against the built CLI engine with fake effects; no git, package manager or network is touched, and the real executable is owned by test-boundaries.
 */
export async function test_cli_leading_dash_refusal(): Promise<void> {
  const refusal: string =
    "The destination and the repository must not start with a dash, which git would read as an option.";
  for (const [title, argv] of [
    ["destination", ["-x"]],
    ["single dash", ["-"]],
    ["repository", ["project", "--repository", "-oProxyCommand=run"]],
    ["both", ["-p", "--repository", "-q"]],
  ] as const) {
    const fake = CliTestHarness.createFakeContext();
    const reason: string | undefined = await CliTestHarness.expectHalt(() =>
      CliTestHarness.getStarter()(CliTestHarness.halter, fake.context)([
        ...argv,
      ]),
    );
    TestValidator.equals(`${title} reason`, reason, refusal);
    TestValidator.equals(`${title} commands`, fake.commands, []);
  }

  for (const argv of [
    ["my-project"],
    ["project", "--repository", "https://example.com/my-template.git"],
  ]) {
    const fake = CliTestHarness.createFakeContext();
    await CliTestHarness.getStarter()(CliTestHarness.halter, fake.context)(
      argv,
    );
    TestValidator.equals(
      `accepted ${argv.join(" ")}`,
      fake.commands[0]!.args[0],
      "clone",
    );
  }
}
