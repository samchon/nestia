import cp from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cp.execSync("next-sitemap", {
  stdio: "inherit",
  cwd: `${__dirname}/..`,
});

for (const file of fs.readdirSync(`${__dirname}/../public`))
  if (
    file === "robots.txt" ||
    (file.startsWith("sitemap") && file.endsWith(".xml"))
  )
    fs.copyFileSync(
      `${__dirname}/../public/${file}`,
      `${__dirname}/../out/${file}`,
    );
