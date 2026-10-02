#!/usr/bin/env node
const USAGE = `Wrong command has been detected. Use like below:

npx nestia [command] [options?]

  1. npx nestia start <directory> [--repository <url>]
  2. npx nestia template <directory> [--repository <url>]
  3. npx nestia dependencies
  4. npx nestia init
  5. npx nestia sdk
  6. npx nestia swagger [--watch]
  7. npx nestia e2e
  8. npx nestia all
`;

function halt(desc: string): never {
  console.error(desc);
  process.exit(-1);
}

/**
 * Dispatches the command in the current process arguments.
 *
 * Scaffold commands load only their engine. Generator commands require the
 * installed SDK executable, which reads the unchanged process arguments itself.
 * Missing SDK installation and unsupported commands terminate with guidance.
 *
 * @evidence contracts/common.md#principled-implementation The command discriminant chooses the corresponding scaffold or the SDK executable; slicing arguments after the subcommand preserves the scaffolder's option values, while importing the SDK retains its process-argument contract.
 * @evidence contracts/common.md#clear-and-simple-design One dispatcher owns command selection and SDK installation guidance. The scaffold engines own their lifecycle, and the SDK executable owns generator behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The recognized names are the documented CLI commands, and require.resolve checks the installed SDK instead of guessing a workspace location or replacing its implementation.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies lazy dispatch, the SDK argument ownership and terminal failures; USAGE lists the supported invocations.
 * @evidence contracts/portability.md#os-neutral-implementation Node module resolution locates the SDK through its package address on the current installation; relative module imports locate scaffold engines. The dispatcher launches no subprocess and leaves native executable handling to those engines.
 */
export async function main(): Promise<void> {
  const type: string | undefined = process.argv[2];
  const argv: string[] = process.argv.slice(3);

  if (type === "start") {
    await (
      await import("./NestiaStarter.js")
    ).NestiaStarter.clone((msg) => halt(msg ?? USAGE))(argv);
  } else if (type === "template") {
    await (
      await import("./NestiaTemplate.js")
    ).NestiaTemplate.clone((msg) => halt(msg ?? USAGE))(argv);
  } else if (
    type === "dependencies" ||
    type === "init" ||
    type === "sdk" ||
    type === "swagger" ||
    type === "e2e" ||
    type === "all"
  ) {
    const location: string = "@nestia/sdk/lib/executable/sdk";
    try {
      require.resolve(location);
    } catch {
      halt(
        [
          `@nestia/sdk has not been installed.`,
          `Install Nestia manually:`,
          `  npm i -D ttsc typescript`,
          `  npm i typia @nestia/core @nestia/sdk @nestia/fetcher`,
          `  npm i -D nestia`,
        ].join("\n"),
      );
    }
    await import(location);
  } else halt(USAGE);
}
main().catch((exp) => {
  console.error(exp instanceof Error ? exp.message : String(exp));
  process.exit(-1);
});
