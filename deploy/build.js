const cp = require("child_process");

const execute = (name) => {
  console.log("=========================================");
  console.log(` Build @nestia/${name}`);
  console.log("=========================================");

  process.chdir(`${__dirname}/../packages/${name}`);

  cp.execSync("pnpm install", { stdio: "inherit" });
  cp.execSync("npm run build", { stdio: "inherit" });
};

const build = async () => {
  await execute("fetcher");
  await execute("core");
  await execute("sdk");
  await execute("e2e");
  await execute("cli");
  await execute("benchmark");
};

module.exports = { build };
