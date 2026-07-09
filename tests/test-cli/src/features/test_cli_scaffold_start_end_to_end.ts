import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

import { CliTestHarness } from "../internal/CliTestHarness";

/**
 * Verifies the real `nestia start` executable scaffolds a pnpm monorepo
 * end-to-end.
 *
 * Unit tests fake every side effect, so only this test proves the built
 * `bin/index.js` wires the engine correctly: a real `git clone`, a real `pnpm
 * install` against a `pnpm-workspace.yaml` project (npm would reject the
 * workspace protocol family outright), real build/test script execution, and
 * real removal of the repository-only files. The `--repository` override keeps
 * it network-free.
 *
 * 1. Create a local fixture git repository shaped like a tiny pnpm monorepo whose
 *    build/test scripts drop `.built` / `.tested` marker files.
 * 2. Run `node packages/cli/bin/index.js start <dest> --repository <fixture>`.
 * 3. Assert the destination exists with both markers present.
 * 4. Assert `.git` and `.github/dependabot.yml` were removed.
 */
export const test_cli_scaffold_start_end_to_end = async (): Promise<void> => {
  const fixture: CliTestHarness.IFixture = CliTestHarness.prepareFixture();
  try {
    CliTestHarness.runCli([
      "start",
      fixture.dest,
      "--repository",
      fixture.repository,
    ]);

    const exists = (...segments: string[]): boolean =>
      fs.existsSync(path.join(fixture.dest, ...segments));
    TestValidator.predicate("dest", fs.existsSync(fixture.dest));
    TestValidator.predicate("workspace", exists("pnpm-workspace.yaml"));
    TestValidator.predicate("build marker", exists(".built"));
    TestValidator.predicate("test marker", exists(".tested"));
    TestValidator.predicate("no .git", exists(".git") === false);
    TestValidator.predicate(
      "no dependabot",
      exists(".github", "dependabot.yml") === false,
    );
  } finally {
    fixture.clean();
  }
};
