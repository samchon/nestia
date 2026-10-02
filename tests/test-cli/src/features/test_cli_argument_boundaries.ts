import { TestValidator } from "@nestia/e2e";

import { CliTestHarness } from "../internal/CliTestHarness";

export const test_cli_argument_boundaries = async (): Promise<void> => {
  const repository = 'https://example.com/template" && malicious';
  const destination = 'project" && malicious';
  const fake: CliTestHarness.IFakeContext = CliTestHarness.createFakeContext();
  await CliTestHarness.getStarter()(CliTestHarness.halter, fake.context)([
    destination,
    "--repository",
    repository,
  ]);
  TestValidator.equals("clone invocation", fake.commands[0], {
    executable: "git",
    args: ["clone", repository, destination],
  });
};
