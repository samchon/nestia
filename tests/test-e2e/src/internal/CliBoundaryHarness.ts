import cp from "child_process";
import fs from "fs";
import path from "path";

/** Owns isolated local template repositories for the actual CLI boundary. */
export namespace CliBoundaryHarness {
  const CLI_MAIN = path.resolve(
    process.cwd(),
    "../../packages/cli/bin/index.js",
  );
  /**
   * The fixture exposes distinct repository and scaffold paths and a cleanup
   * operation.
   */
  export interface IFixture {
    /** Local git repository standing in for the template repository. */
    repository: string;
    /** Scaffold destination; does not exist until the CLI creates it. */
    dest: string;
    /** Removes the fixture repository and scaffold workspace. */
    clean: () => void;
  }

  /**
   * Creates a local git repository shaped like a tiny pnpm monorepo whose root
   * `build` / `test` scripts drop `.built` / `.tested` marker files, so tests
   * can prove which lifecycle steps the CLI actually ran.
   */
  export const prepareFixture = (): IFixture => {
    const cache: string = path.resolve(
      __dirname,
      "../../../../node_modules/.cache/test-e2e",
    );
    fs.mkdirSync(cache, { recursive: true });
    const workspace: string = fs.mkdtempSync(
      path.join(cache, "nestia-cli-scaffold-"),
    );
    const repository: string = path.join(workspace, "repository");
    try {
      write(
        repository,
        "package.json",
        JSON.stringify(
          {
            name: "nestia-cli-fixture",
            version: "0.0.1",
            private: true,
            scripts: {
              build: `node -e "require('fs').writeFileSync('.built','1')"`,
              test: `node -e "require('fs').writeFileSync('.tested','1')"`,
            },
          },
          null,
          2,
        ),
      );
      write(repository, "pnpm-workspace.yaml", `packages:\n  - "packages/*"\n`);
      write(
        repository,
        path.join("packages", "api", "package.json"),
        JSON.stringify(
          { name: "nestia-cli-fixture-api", version: "0.0.1", private: true },
          null,
          2,
        ),
      );
      write(
        repository,
        path.join(".github", "dependabot.yml"),
        "version: 2\nupdates: []\n",
      );

      const git = (...args: string[]): void =>
        void cp.execFileSync("git", args, { cwd: repository, stdio: "ignore" });
      git("init");
      git("add", ".");
      git(
        "-c",
        "user.name=nestia",
        "-c",
        "user.email=nestia@test",
        "-c",
        "commit.gpgsign=false",
        "commit",
        "-m",
        "fixture",
      );

      return {
        repository,
        dest: path.join(workspace, "project"),
        clean: () => {
          for (const directory of [repository, workspace])
            fs.rmSync(directory, {
              recursive: true,
              force: true,
              maxRetries: 4,
            });
        },
      };
    } catch (error) {
      for (const directory of [repository, workspace])
        fs.rmSync(directory, { recursive: true, force: true, maxRetries: 4 });
      throw error;
    }
  };

  /** Runs the real CLI executable (`packages/cli/bin/index.js`). */
  export const runCli = (args: string[]): void =>
    void cp.execFileSync(process.execPath, [CLI_MAIN, ...args], {
      stdio: "inherit",
    });

  const write = (root: string, file: string, content: string): void => {
    const location: string = path.join(root, file);
    fs.mkdirSync(path.dirname(location), { recursive: true });
    fs.writeFileSync(location, content, "utf8");
  };
}
