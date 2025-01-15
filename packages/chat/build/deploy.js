const cp = require("child_process");
const fs = require("fs");

const getAgentVersion = async () => {
  const packageJson = JSON.parse(
    await fs.promises.readFile(
      `${__dirname}/../../agent/package.json`,
      "utf-8",
    ),
  );
  return packageJson.version;
};

const main = async () => {
  const agent = await getAgentVersion();
  const packageJson = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../package.json`, "utf8"),
  );
  const tag = packageJson.version.includes("dev") ? "next" : "latest";

  await fs.promises.writeFile(
    `${__dirname}/../package.json`,
    JSON.stringify(
      {
        ...packageJson,
        dependencies: {
          ...packageJson.dependencies,
          "@nestia/agent": `^${agent}`,
        },
      },
      null,
      2,
    ),
    "utf8",
  );

  const execute = (str) =>
    cp.execSync(str, {
      cwd: `${__dirname}/..`,
      stdio: "inherit",
    });
  execute("npm run build");
  execute(`npm publish --tag ${tag}`);

  await fs.promises.writeFile(
    `${__dirname}/../package.json`,
    JSON.stringify(packageJson, null, 2),
    "utf8",
  );
};
main().catch((error) => {
  console.log(error);
  process.exit(-1);
});
