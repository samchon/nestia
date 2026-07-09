import { TestValidator } from "@nestia/e2e";

import { CliTestHarness } from "../internal/CliTestHarness";

/**
 * Verifies `nestia start` clones `nestia-start` and drives the full pnpm
 * lifecycle in order.
 *
 * The new template repository is a pnpm monorepo whose manifests use the
 * `catalog:` dependency protocol, which npm cannot resolve — the previous `npm
 * install` flow hard-failed on it. This locks the exact command sequence (pnpm,
 * not npm; canonical `nestia-start` URL, not the renamed `nestia-template`
 * redirect) plus the trailing repository-file cleanup.
 *
 * 1. Run the starter's `clone` against a fake context with pnpm available.
 * 2. Assert the executed commands are exactly clone → install → build → test.
 * 3. Assert `.git` and `.github/dependabot.yml` are removed afterwards.
 */
export const test_cli_start_command_sequence = async (): Promise<void> => {
  const fake: CliTestHarness.IFakeContext = CliTestHarness.createFakeContext();
  await CliTestHarness.getStarter()(CliTestHarness.halter, fake.context)([
    "my-project",
  ]);

  TestValidator.equals("commands", fake.commands, [
    `git clone "https://github.com/samchon/nestia-start" "my-project"`,
    "pnpm install",
    "pnpm run build",
    "pnpm run test",
  ]);
  TestValidator.equals("chdir", fake.chdirs, ["my-project"]);
  TestValidator.equals("removed", fake.removed, [
    ".git",
    ".github/dependabot.yml",
  ]);
};
