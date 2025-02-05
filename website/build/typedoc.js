import cp from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

cp.execSync(`npx typedoc --entryPointStrategy merge "typedoc-json/*.json"`, {
  cwd: `${__dirname}/..`,
  stdio: "inherit",
});
