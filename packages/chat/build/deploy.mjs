import cp from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  try {
    execute("npm run build");
    execute(`npm publish --tag ${tag}`);
  } catch (error) {
    throw error;
  } finally {
    await fs.promises.writeFile(
      `${__dirname}/../package.json`,
      JSON.stringify(packageJson, null, 2),
      "utf8",
    );
  }
};
main().catch((error) => {
  console.log(error);
  process.exit(-1);
});
