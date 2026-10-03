import { TestValidator } from "../../../../packages/e2e/lib";
import { CliTestHarness } from "../internal/CliTestHarness";

/**
 * Verifies the scaffolder falls back to `corepack pnpm` when pnpm is not
 * directly installed.
 *
 * When corepack is installed, machines without a global pnpm can still resolve
 * the `catalog:` protocol through it — but only if the CLI both prefixes every
 * lifecycle command with `corepack pnpm` and suppresses the interactive
 * download prompt that would otherwise hang a non-interactive scaffold.
 *
 * 1. Run `nestia start` with a fake context where only `corepack --version` probes
 *    successfully.
 * 2. Assert install/build/test commands are prefixed with `corepack pnpm`.
 * 3. Assert `COREPACK_ENABLE_DOWNLOAD_PROMPT` is set to `"0"`.
 *
 * @evidence contracts/testing.md#behavioral-verification Failed pnpm probe followed by successful corepack chooses exact corepack pnpm lifecycle vectors and suppresses its download prompt.
 * @evidence contracts/testing.md#independent-expectations The authored probe boundary admits only corepack; literal install/build/test vectors and prompt zero follow that fallback contract.
 * @evidence contracts/testing.md#distinguishing-cases Probe order, all three command prefixes and prompt suppression detect independent fallback errors; finally restores the original environment.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this direct unit through test-cli test:unit. Caller-built starter/template operations execute with the authored command context, not a native scaffold process.
 */
export const test_cli_package_manager_corepack_fallback =
  async (): Promise<void> => {
    const original: string | undefined =
      process.env.COREPACK_ENABLE_DOWNLOAD_PROMPT;
    delete process.env.COREPACK_ENABLE_DOWNLOAD_PROMPT;
    try {
      const fake: CliTestHarness.IFakeContext =
        CliTestHarness.createFakeContext({
          probe: (invocation) => invocation.executable === "corepack",
        });
      await CliTestHarness.getStarter()(CliTestHarness.halter, fake.context)([
        "my-project",
      ]);

      TestValidator.equals("probes", fake.probes, [
        { executable: "pnpm", args: ["--version"] },
        { executable: "corepack", args: ["--version"] },
      ]);
      TestValidator.equals("commands", fake.commands.slice(1), [
        { executable: "corepack", args: ["pnpm", "install"] },
        { executable: "corepack", args: ["pnpm", "run", "build"] },
        { executable: "corepack", args: ["pnpm", "run", "test"] },
      ]);
      TestValidator.equals<string | undefined>(
        "prompt",
        "0",
        process.env.COREPACK_ENABLE_DOWNLOAD_PROMPT,
      );
    } finally {
      if (original === undefined)
        delete process.env.COREPACK_ENABLE_DOWNLOAD_PROMPT;
      else process.env.COREPACK_ENABLE_DOWNLOAD_PROMPT = original;
    }
  };
