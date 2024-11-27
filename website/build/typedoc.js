const cp = require("child_process");
const fs = require("fs");

for (const pack of ["benchmark", "core", "e2e", "fetcher"]) {
  const location = `${__dirname}/../../packages/${pack}`;
  if (fs.existsSync(`${location}/node_modules`) === false)
    cp.execSync("npm install", { cwd: location, stdio: "ignore" });
  cp.execSync(
    [
      `npx typedoc --json typedoc-json/${pack}.json`,
      `--options ../packages/${pack}/typedoc.json`,
      `--validation.invalidLink false`,
    ].join(" "),
    {
      cwd: `${__dirname}/..`,
      stdio: "ignore",
    },
  );
}
cp.execSync(`npx typedoc --entryPointStrategy merge "typedoc-json/*.json"`, {
  cwd: `${__dirname}/..`,
  stdio: "ignore",
});
