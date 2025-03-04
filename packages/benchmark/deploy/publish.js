const cp = require("child_process");
const fs = require("fs");

const main = async () => {
  const load = async () =>
    JSON.parse(await fs.promises.readFile(`${__dirname}/../package.json`));
  const original = await load();
  const updated = await load();

  const { version } = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../package.json`, "utf8"),
  );
  const { version: cliVersion } = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../cli/package.json`, "utf8"),
  );

  delete updated.private;
  for (const dict of [updated.dependencies, updated.devDependencies])
    for (const [key, value] of Object.entries(dict))
      if (value === "workspace:^")
        dict[key] = key === "nestia" ? `^${cliVersion}` : `^${version}`;

  try {
    await fs.promises.writeFile(
      `${__dirname}/../package.json`,
      JSON.stringify(updated, null, 2),
      "utf8",
    );
    cp.execSync("npm publish", {
      cwd: `${__dirname}/..`,
      stdio: "inherit",
    });
  } catch (error) {
    throw error;
  } finally {
    await fs.promises.writeFile(
      `${__dirname}/../package.json`,
      JSON.stringify(original, null, 2),
      "utf8",
    );
  }
};
main().catch((error) => {
  console.log(error);
  process.exit(-1);
});
