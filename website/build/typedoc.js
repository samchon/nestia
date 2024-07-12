const cp = require("child_process");
const fs = require("fs");

const execute = (str) => {
  cp.execSync(str, { cwd: `${__dirname}/..`, stdio: "ignore" });
};

for (const pack of ["benchmark", "core", "e2e", "fetcher"]) {
  if (fs.existsSync(`../packages/${pack}/node_modules`) === false)
    execute("npm install");
  execute(
    [
      `npx typedoc --json typedoc-json/${pack}.json`,
      `--options ../packages/${pack}/typedoc.json`,
      `--validation.invalidLink false`,
    ].join(" "),
  );
}
execute(`npx typedoc --entryPointStrategy merge "typedoc-json/*.json"`);
