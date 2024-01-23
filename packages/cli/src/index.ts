#!/usr/bin/env node
const USAGE = `Wrong command has been detected. Use like below:

npx nestia [command] [options?]

  1. npx nestia start <directory>
  2. npx nestia template <directory>
  3. npx nestia setup
  4. npx nestia dependencies
  5. npx nestia init
  6. npx nestia sdk
  7. npx nestia swagger
  8. npx nestia e2e
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
      await import("./NestiaStarter")
    ).NestiaStarter.clone((msg) => halt(msg ?? USAGE))(argv);
  } else if (type === "template") {
    await (
      await import("./NestiaTemplate")
    ).NestiaTemplate.clone((msg) => halt(msg ?? USAGE))(argv);
  } else if (type === "setup") {
    try {
      await import("comment-json");
      await import("inquirer");
      await import("commander");
    } catch {
      halt(`nestia has not been installed. Run "npm i -D nestia" before.`);
    }
    await (await import("./NestiaSetupWizard")).NestiaSetupWizard.setup();
  } else if (
    type === "dependencies" ||
    type === "init" ||
    type === "sdk" ||
    type === "swagger" ||
    type === "e2e"
  ) {
    try {
      require.resolve("@nestia/sdk/lib/executable/sdk");
    } catch {
      halt(
        `@nestia/sdk has not been installed. Run "npx nestia setup" before.`,
      );
    }
    await import("@nestia/sdk/lib/executable/sdk");
  } else halt(USAGE);
}
main().catch((exp) => {
  console.log(exp.message);
  process.exit(-1);
});
