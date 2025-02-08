import cp from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const main = async () => {
  // BUILD PACKAGES
  for (const pack of ["agent", "benchmark", "core", "e2e", "fetcher"]) {
    const location = `${__dirname}/../../packages/${pack}`;
    if (fs.existsSync(`${location}/node_modules`) === false)
      cp.execSync("pnpm install", { cwd: location, stdio: "ignore" });
    cp.execSync(
      [
        `npx typedoc --json typedoc-json/${pack}.json`,
        `--options ../packages/${pack}/typedoc.json`,
        `--validation.invalidLink false`,
      ].join(" "),
      {
        cwd: `${__dirname}/..`,
        stdio: "inherit",
      },
    );
  }

  // LOAD DEPENDENCIES
  for (const { name, url } of [
    {
      name: "openapi",
      url: "https://samchon.github.io/openapi/api/openapi.json",
    },
    { name: "typia", url: "https://typia.io/api/typia.json" },
  ])
    await fs.promises.writeFile(
      `${__dirname}/../typedoc-json/${name}.json`,
      await fetch(url).then((r) => r.text()),
      "utf8",
    );

  // MERGE JSON FILES
  cp.execSync(`npx typedoc --entryPointStrategy merge "typedoc-json/*.json"`, {
    cwd: `${__dirname}/..`,
    stdio: "inherit",
  });
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
