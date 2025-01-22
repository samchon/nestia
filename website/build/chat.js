import cp from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AGENT = `${__dirname}/../../packages/agent`;
const CHAT = `${__dirname}/../../packages/chat`;
const PUBLIC = `${__dirname}/../public/chat`;

const copy = async (src, dest) => {
  try {
    if (fs.existsSync(dest)) await fs.promises.rm(dest, { recursive: true });
  } catch {}
  try {
    await fs.promises.mkdir(dest);
  } catch {}

  const directory = await fs.promises.readdir(src);
  for (const file of directory) {
    const x = path.join(src, file);
    const y = path.join(dest, file);
    const stat = await fs.promises.stat(x);
    if (stat.isDirectory()) await copy(x, y);
    else await fs.promises.writeFile(y, await fs.promises.readFile(x));
  }
};

const main = async () => {
  cp.execSync("npm run build", {
    stdio: "ignore",
    cwd: AGENT,
  });
  cp.execSync("npm run build:static", {
    stdio: "ignore",
    cwd: CHAT,
  });
  await copy(`${CHAT}/dist`, PUBLIC);
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
