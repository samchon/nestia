const { version } = require("../package.json");
const { build } = require("./build");
const { migrate } = require("./migrate");
const { publish } = require("./publish");

const PACKAGES = ["cli", "fetcher", "core", "sdk", "e2e", "benchmark"];

const main = async () => {
  await build();
  if (process.argv[2] === "publish") {
    const index = process.argv.indexOf("--tag");
    const tag = index === -1 ? "next" : process.argv[index + 1];
    await publish({
      tag,
      version: (name) =>
        ["nestia", ...PACKAGES].includes(name) ? version : null,
      packages: PACKAGES,
    });
    if (tag === "latest" || process.argv.includes("--migrate"))
      await migrate({
        tag,
        version: () => version,
      });
  }
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
