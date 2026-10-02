import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

import { CliBoundaryHarness } from "../internal/CliBoundaryHarness";

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
 *
 * @evidence contracts/testing.md#behavioral-verification The built CLI template dispatch clones and builds a workspace without running tests.
 * @evidence contracts/testing.md#independent-expectations The fixture scripts independently emit built and tested markers so their presence distinguishes command dispatch.
 * @evidence contracts/testing.md#distinguishing-cases Template must produce the build marker, omit the test marker and remove repository-only metadata.
 * @evidence contracts/testing.md#execution-ownership The test-e2e source entry discovers this real CLI or HTTP boundary by its test-prefixed export.
 * @evidence contracts/e2e.md#necessary-boundary The built CLI dispatcher must connect argument parsing to real git and pnpm lifecycle operations; injected engine unit cases cannot prove dispatcher wiring.
 * @evidence contracts/e2e.md#shared-execution Both command cases consume caller-built CLI artifacts and the same installed package manager. Their independent scaffold outputs are required because start runs tests and template must omit them.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A fresh repository and destination isolate clone mutations and lifecycle markers; the fixture cleanup executes in finally after command completion or failure.
 * @evidence contracts/e2e.md#preserved-coverage The original build/test markers, repository-metadata removal and command-specific assertions remain in this relocated test; engine option and failure semantics remain in test-cli units.
 */

export const test_cli_scaffold_template_end_to_end =
  async (): Promise<void> => {
    const fixture: CliBoundaryHarness.IFixture =
      CliBoundaryHarness.prepareFixture();
    try {
      CliBoundaryHarness.runCli([
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
