import cp from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const main = async () => {
  cp.execSync("npx typedoc", {
    cwd: `${__dirname}/..`,
    stdio: "inherit",
  });
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
