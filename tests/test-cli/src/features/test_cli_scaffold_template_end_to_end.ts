import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

import { CliTestHarness } from "../internal/CliTestHarness";

/**
 * Verifies the real `nestia template` executable scaffolds a pnpm monorepo
 * without running its test suite.
 *
 * The template command shares the starter's engine but must stop after the
 * build step — the backend template's test suite expects databases and other
 * infrastructure a fresh clone does not have. Only a real CLI run proves the
 * dispatcher maps `template` onto the no-test configuration.
 *
 * 1. Create a local fixture git repository whose build/test scripts drop `.built`
 *    / `.tested` marker files.
 * 2. Run `node packages/cli/bin/index.js template <dest> --repository <fixture>`.
 * 3. Assert the build marker exists but the test marker does not.
 * 4. Assert `.git` and `.github/dependabot.yml` were removed.
 */
export const test_cli_scaffold_template_end_to_end =
  async (): Promise<void> => {
    const fixture: CliTestHarness.IFixture = CliTestHarness.prepareFixture();
    try {
      CliTestHarness.runCli([
        "template",
        fixture.dest,
        "--repository",
        fixture.repository,
      ]);

      const exists = (...segments: string[]): boolean =>
        fs.existsSync(path.join(fixture.dest, ...segments));
      TestValidator.predicate("dest", fs.existsSync(fixture.dest));
      TestValidator.predicate("build marker", exists(".built"));
      TestValidator.predicate("no test marker", exists(".tested") === false);
      TestValidator.predicate("no .git", exists(".git") === false);
      TestValidator.predicate(
        "no dependabot",
        exists(".github", "dependabot.yml") === false,
      );
    } finally {
      fixture.clean();
    }
  };
