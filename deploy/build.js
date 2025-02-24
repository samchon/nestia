const cp = require("child_process");

const execute = (name) => {
  console.log("=========================================");
  console.log(` Build @nestia/${name}`);
  console.log("=========================================");

  process.chdir(`${__dirname}/../packages/${name}`);
  cp.execSync("pnpm run build", { stdio: "inherit" });
};

const build = async (packages) => {
  for (const pack of packages ?? [
    "fetcher",
    "core",
    "sdk",
    "e2e",
    "cli",
    "benchmark",
  ])
    await execute(pack);
};

module.exports = { build };
