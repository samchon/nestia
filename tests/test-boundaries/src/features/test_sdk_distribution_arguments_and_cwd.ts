import { TestValidator } from "@nestia/e2e";
import cp from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies distribution composition keeps npm arguments and independent cwd.
 *
 * Dependency specifiers belong to npm, so shell metacharacters must arrive as
 * literal argument bytes while parallel compositions keep their destinations.
 *
 * 1. Create an npm entry fixture and package manifests with range specifiers.
 * 2. Compose two distinct destinations concurrently through the real composer.
 * 3. Assert unchanged cwd, exact npm argv and destination-relative config paths.
 *
 * @evidence contracts/testing.md#behavioral-verification The composer launches the controlled npm executable and each destination records the full received argv and cwd; metacharacter or whitespace interpretation and global chdir races change those observations.
 * @evidence contracts/testing.md#independent-expectations Literal fixture manifest versions establish expected opaque npm specifiers. Native path.relative independently determines generated configuration paths.
 * @evidence contracts/testing.md#distinguishing-cases Two parallel destinations, caret and comparison ranges with spaces, percent/placeholder-bearing paths, dev/runtime groups and a configured no-op cover argument and destination boundaries. The emitted build helper removes only functional output and launches npx in the original root.
 * @evidence contracts/testing.md#execution-ownership E2E: this discoverable boundary directly calls the built composer, but retains the real executable/argv handoff to a controlled npm entry rather than replacing child_process methods.
 * @evidence contracts/e2e.md#necessary-boundary A real child observes argv and cwd, which an in-process call cannot prove the OS launches unchanged. No network installation or compiler is needed for this package-manager connection.
 * @evidence contracts/e2e.md#shared-execution Both concurrent destinations reuse one inert package-manager installation and authored manifests. Each composition still launches its dev and runtime install operations independently because destinations differ.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique mkdtemp paths own the fixture executable, manifests and outputs. PATH and cwd are restored and only the owned root is removed in finally; no foreign child methods are replaced.
 * @evidence contracts/e2e.md#preserved-coverage This adds previously missing opaque npm argument and concurrent destination checks. Existing real installed SDK distribution features retain package installation and compilation coverage.
 */
export const test_sdk_distribution_arguments_and_cwd =
  async (): Promise<void> => {
    const { SdkDistributionComposer } = require(
      path.resolve(
        process.cwd(),
        "../../packages/sdk/lib/generates/internal/SdkDistributionComposer",
      ),
    ) as {
      SdkDistributionComposer: { compose: (props: object) => Promise<void> };
    };
    const originalCwd = process.cwd();
    const originalPath = process.env.PATH;
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-distribution-"));
    try {
      const bin = path.join(root, "bin");
      fs.mkdirSync(bin);
      const script = [
        'const fs = require("fs");',
        'const file = "npm-calls.json";',
        'const calls = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];',
        "calls.push({ args: process.argv.slice(2), cwd: process.cwd() });",
        "fs.writeFileSync(file, JSON.stringify(calls));",
      ].join("\n");
      if (process.platform === "win32") {
        fs.writeFileSync(path.join(bin, "npm.cmd"), "@echo off\n");
        fs.writeFileSync(path.join(bin, "npx.cmd"), "@echo off\n");
        const directory = path.join(bin, "node_modules/npm/bin");
        fs.mkdirSync(directory, { recursive: true });
        fs.writeFileSync(path.join(directory, "npm-cli.js"), script);
        fs.writeFileSync(
          path.join(directory, "npx-cli.js"),
          script.replace("npm-calls.json", "npx-calls.json"),
        );
      } else {
        const executable = path.join(bin, "npm");
        fs.writeFileSync(executable, "#!/usr/bin/env node\n" + script);
        fs.chmodSync(executable, 0o755);
        const npx = path.join(bin, "npx");
        fs.writeFileSync(
          npx,
          "#!/usr/bin/env node\n" +
            script.replace("npm-calls.json", "npx-calls.json"),
        );
        fs.chmodSync(npx, 0o755);
      }
      const versions = {
        ttsc: "^7.0.0",
        typescript: ">=7.0.0 <8.0.0",
        typia: "^14.0.0",
      };
      for (const [name, version] of Object.entries(versions)) {
        const directory = path.join(root, "node_modules", name);
        fs.mkdirSync(directory, { recursive: true });
        fs.writeFileSync(
          path.join(directory, "package.json"),
          JSON.stringify({ name, version }),
        );
      }
      process.env.PATH = bin + path.delimiter + (originalPath ?? "");
      process.chdir(root);
      const generated = path.join(root, "generated %PATH% ${root}");
      const outputs = [
        path.join(root, "first distribution %PATH% ${output}"),
        path.join(root, "second distribution %PATH% ${output}"),
      ];
      const compositions = await Promise.allSettled(
        outputs.map((distribute) =>
          SdkDistributionComposer.compose({
            config: { output: generated, distribute },
            mcp: false,
            websocket: false,
          }),
        ),
      );
      const failures = compositions.filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      );
      if (failures.length !== 0)
        throw new AggregateError(
          failures.map((result) => result.reason),
          "Distribution compositions failed.",
        );
      TestValidator.equals("caller cwd preserved", process.cwd(), root);
      for (const distribute of outputs) {
        const calls = JSON.parse(
          fs.readFileSync(path.join(distribute, "npm-calls.json"), "utf8"),
        ) as Array<{ args: string[]; cwd: string }>;
        TestValidator.equals(
          "dependency specifiers unchanged",
          calls[0]!.args,
          [
            "install",
            "--save-dev",
            "rimraf",
            `ttsc@${versions.ttsc}`,
            `typescript@${versions.typescript}`,
          ],
        );
        TestValidator.equals(
          "both child destinations",
          calls.map((call) => call.cwd),
          [distribute, distribute],
        );
        TestValidator.equals(
          "runtime package range",
          calls[1]!.args.at(-1),
          `typia@${versions.typia}`,
        );
        const tsconfig = JSON.parse(
          fs.readFileSync(path.join(distribute, "tsconfig.json"), "utf8"),
        );
        const relativeOutput = path
          .relative(distribute, generated)
          .split(path.sep)
          .join("/");
        TestValidator.equals(
          "compiler source directory",
          tsconfig.compilerOptions.rootDir,
          relativeOutput,
        );
        TestValidator.equals(
          "compiler includes generated SDK",
          tsconfig.include,
          [relativeOutput],
        );
        fs.mkdirSync(path.join(generated, "functional"), { recursive: true });
        fs.writeFileSync(path.join(generated, "functional/stale.js"), "stale");
        fs.mkdirSync(path.join(generated, "structures"), { recursive: true });
        fs.writeFileSync(
          path.join(generated, "structures/keep.ts"),
          "retained",
        );
        cp.execFileSync(
          process.execPath,
          [path.join(distribute, "build-sdk.cjs")],
          { cwd: distribute, stdio: "ignore" },
        );
        TestValidator.equals(
          "owned functional output removed",
          fs.existsSync(path.join(generated, "functional")),
          false,
        );
        TestValidator.equals(
          "other generated outputs preserved",
          fs.readFileSync(path.join(generated, "structures/keep.ts"), "utf8"),
          "retained",
        );
        const npxCalls = JSON.parse(
          fs.readFileSync(path.join(root, "npx-calls.json"), "utf8"),
        ) as Array<{ args: string[]; cwd: string }>;
        TestValidator.equals("SDK generator arguments", npxCalls.at(-1)!.args, [
          "nestia",
          "sdk",
        ]);
        TestValidator.equals("SDK generator root", npxCalls.at(-1)!.cwd, root);
        const json = JSON.parse(
          fs.readFileSync(path.join(distribute, "package.json"), "utf8"),
        );
        json.dependencies = { "@nestia/fetcher": "1.0.0" };
        fs.writeFileSync(
          path.join(distribute, "package.json"),
          JSON.stringify(json),
        );
        await SdkDistributionComposer.compose({
          config: { output: generated, distribute },
          mcp: false,
          websocket: false,
        });
        TestValidator.equals(
          "configured composition no-op",
          JSON.parse(
            fs.readFileSync(path.join(distribute, "npm-calls.json"), "utf8"),
          ),
          calls,
        );
      }
      if (process.platform === "win32") {
        const localCli = path.resolve(bin, "../npm/bin");
        fs.mkdirSync(localCli, { recursive: true });
        for (const name of ["npm-cli.js", "npx-cli.js"]) {
          const globalEntry = path.join(bin, "node_modules/npm/bin", name);
          fs.copyFileSync(globalEntry, path.join(localCli, name));
          fs.unlinkSync(globalEntry);
        }
        const distribute = path.join(root, "local npm layout");
        await SdkDistributionComposer.compose({
          config: { output: generated, distribute },
          mcp: false,
          websocket: false,
        });
        const calls = JSON.parse(
          fs.readFileSync(path.join(distribute, "npm-calls.json"), "utf8"),
        ) as Array<{ args: string[]; cwd: string }>;
        TestValidator.equals(
          "local shim dependency specifiers",
          calls[0]!.args,
          [
            "install",
            "--save-dev",
            "rimraf",
            `ttsc@${versions.ttsc}`,
            `typescript@${versions.typescript}`,
          ],
        );
        cp.execFileSync(
          process.execPath,
          [path.join(distribute, "build-sdk.cjs")],
          { stdio: "ignore" },
        );
        const npxCalls = JSON.parse(
          fs.readFileSync(path.join(root, "npx-calls.json"), "utf8"),
        ) as Array<{ args: string[]; cwd: string }>;
        TestValidator.equals(
          "local npx shim generator arguments",
          npxCalls.at(-1)!.args,
          ["nestia", "sdk"],
        );
        TestValidator.equals(
          "local npx shim generator root",
          npxCalls.at(-1)!.cwd,
          root,
        );
      }
    } finally {
      process.chdir(originalCwd);
      if (originalPath === undefined) delete process.env.PATH;
      else process.env.PATH = originalPath;
      fs.rmSync(root, { recursive: true, force: true });
    }
  };
