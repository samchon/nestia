import cp from "child_process";
import fs from "fs";

import { IMigrateConfig } from "../IMigrateConfig";
import { MigrateApplication } from "../MigrateApplication";
import { FileArchiver } from "../archivers/FileArchiver";
import { IMigrateFile } from "../structures/IMigrateFile";
import { ISwagger } from "../structures/ISwagger";

const SAMPLE = __dirname + "/../../assets/input";
const TEST = __dirname + "/../../../../test/features";
const OUTPUT = __dirname + "/../../assets/output";

const measure = (title: string) => async (task: () => Promise<void>) => {
  process.stdout.write(`  - ${title}: `);
  const time: number = Date.now();
  await task();
  console.log(`${(Date.now() - time).toLocaleString()} ms`);
  return time;
};

const execute =
  (config: IMigrateConfig) => (project: string) => (swagger: ISwagger) =>
    measure(`${project}-${config.mode}-${config.simulate}`)(async () => {
      const directory = `${OUTPUT}/${project}-${config.mode}-${config.simulate}`;
      const app: MigrateApplication = new MigrateApplication(swagger);
      const files: IMigrateFile[] =
        config.mode === "nest"
          ? app.nest(config.simulate)
          : app.sdk(config.simulate);

      await FileArchiver.archive({
        mkdir: fs.promises.mkdir,
        writeFile: (file, content) =>
          fs.promises.writeFile(file, content, "utf-8"),
      })(directory)(files);
      cp.execSync(`npx tsc -p ${directory}/tsconfig.json`, {
        stdio: "inherit",
        cwd: directory,
      });
    });

const main = async () => {
  if (fs.existsSync(OUTPUT)) await fs.promises.rm(OUTPUT, { recursive: true });
  await fs.promises.mkdir(OUTPUT);

  const only = (() => {
    const index: number = process.argv.indexOf("--only");
    if (index !== -1) return process.argv[index + 1]?.trim();
    return undefined;
  })();

  for (const file of await fs.promises.readdir(SAMPLE)) {
    const location: string = `${SAMPLE}/${file}`;
    if (!location.endsWith(".json")) continue;

    const project: string = file.substring(0, file.length - 5);
    if ((only ?? project) !== project) continue;

    const swagger: ISwagger = JSON.parse(fs.readFileSync(location, "utf8"));
    for (const mode of ["nest", "sdk"] as const)
      for (const simulate of [true, false])
        await execute({ mode, simulate })(project)(swagger);
  }

  for (const feature of fs.readdirSync(TEST)) {
    if ((only ?? feature) !== feature) continue;
    else if (feature === "clone-and-propagate") continue;

    const stats: fs.Stats = fs.statSync(`${TEST}/${feature}`);
    if (stats.isDirectory() === false) continue;
    else if (feature.includes("error")) continue;

    const location: string = `${TEST}/${feature}/swagger.json`;
    if (fs.existsSync(location) === false) continue;

    const swagger: ISwagger = JSON.parse(fs.readFileSync(location, "utf8"));
    for (const mode of ["nest", "sdk"] as const)
      for (const simulate of [true, false])
        await execute({ mode, simulate })(feature)(swagger);
  }
};
main();
