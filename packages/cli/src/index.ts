#!/usr/bin/env node
const USAGE = `Wrong command has been detected. Use like below:

npx nestia [command] [options?]

  1. npx nestia start <directory>
  2. npx nestia template <directory>
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

async function main(): Promise<void> {
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
