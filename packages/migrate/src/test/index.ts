import cp from "child_process";
import fs from "fs";
import { format } from "prettier";
import { IValidation } from "typia";

import { MigrateApplication } from "../MigrateApplication";
import { MigrateFileArchiver } from "../archivers/MigrateFileArchiver";
import { IMigrateProgram } from "../structures/IMigrateProgram";
import { ISwagger } from "../structures/ISwagger";

const SAMPLE = __dirname + "/../../assets/input";
const TEST = __dirname + "/../../../../test/features";
const OUTPUT = __dirname + "/../../assets/output";

const beautify = async (script: string): Promise<string> => {
  try {
    return await format(script, {
      parser: "typescript",
    });
  } catch {
    return script;
  }
};

const measure = (title: string) => async (task: () => Promise<void>) => {
  process.stdout.write(`  - ${title}: `);
  const time: number = Date.now();
  await task();
  console.log(`${(Date.now() - time).toLocaleString()} ms`);
  return time;
};

const execute =
  (config: IMigrateProgram.IConfig) =>
  (project: string) =>
  (swagger: ISwagger) =>
    measure(`${project}-${config.mode}-${config.simulate}-${config.e2e}`)(
      async () => {
        const directory = `${OUTPUT}/${project}-${config.mode}-${config.simulate}-${config.e2e}`;
        const result: IValidation<MigrateApplication> =
          MigrateApplication.create(swagger);
        if (result.success === false)
          throw new Error(
            `Invalid swagger file (must follow the OpenAPI 3.0 spec).`,
          );

        const app: MigrateApplication = result.data;
        const { files } =
          config.mode === "nest" ? app.nest(config) : app.sdk(config);

        await MigrateFileArchiver.archive({
          mkdir: fs.promises.mkdir,
          writeFile: async (file, content) =>
            fs.promises.writeFile(file, await beautify(content), "utf-8"),
        })(directory)(files);
        cp.execSync(`npx tsc -p ${directory}/tsconfig.json`, {
          stdio: "inherit",
          cwd: directory,
        });
        cp.execSync(`npx tsc -p ${directory}/test/tsconfig.json`, {
          stdio: "inherit",
          cwd: directory,
        });
      },
    );

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
    for (const [mode, flag] of [
      ["nest", true],
      ["sdk", true],
      ["sdk", false],
    ] as const)
      await execute({
        mode,
        simulate: flag,
        e2e: flag,
      })(project)(swagger);
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
    for (const [mode, flag] of [
      ["nest", true],
      ["sdk", true],
      ["sdk", false],
    ] as const)
      await execute({
        mode,
        simulate: flag,
        e2e: flag,
      })(feature)(swagger);
  }
};
main();
