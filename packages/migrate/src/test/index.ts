import { OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@samchon/openapi";
import cp from "child_process";
import fs from "fs";
import { IValidation } from "typia";

import { NestiaMigrateApplication } from "../NestiaMigrateApplication";
import { NestiaMigrateFileArchiver } from "../archivers/NestiaMigrateFileArchiver";
// import { NestiaMigrateCommander } from "../executable/NestiaMigrateCommander";
import { INestiaMigrateConfig } from "../structures/INestiaMigrateConfig";

const INPUT: string = `${__dirname}/../../assets/input`;
const OUTPUT: string = `${__dirname}/../../assets/output`;

const measure =
  (title: string) =>
  async (task: () => Promise<void>): Promise<number> => {
    process.stdout.write(`  - ${title}: `);
    const time: number = Date.now();
    await task();
    console.log(`${(Date.now() - time).toLocaleString()} ms`);
    return time;
  };

const execute = (
  mode: "nest" | "sdk",
  config: INestiaMigrateConfig,
  project: string,
  document: SwaggerV2.IDocument | OpenApiV3.IDocument | OpenApiV3_1.IDocument,
): Promise<number> =>
  measure(`${project}-${mode}-${config.simulate}-${config.e2e}`)(async () => {
    const directory = `${OUTPUT}/${project}-${mode}-${config.simulate}-${config.e2e}`;
    const result: IValidation<NestiaMigrateApplication> =
      await NestiaMigrateApplication.validate(document);
    if (result.success === false)
      throw new Error(
        `Invalid swagger file (must follow the OpenAPI 3.0 spec).`,
      );

    const app: NestiaMigrateApplication = result.data;
    const files: Record<string, string> =
      mode === "nest"
        ? app.nest({
            ...config,
            package: project,
          })
        : app.sdk({
            ...config,
            package: project,
          });

    await NestiaMigrateFileArchiver.archive({
      mkdir: fs.promises.mkdir,
      writeFile: async (file, content) =>
        fs.promises.writeFile(
          file,
          content,
          // await NestiaMigrateCommander.beautify(content),
          "utf-8",
        ),
      root: directory,
      files,
    });
    cp.execSync(`npx tsc -p ${directory}/tsconfig.json`, {
      stdio: "ignore",
      cwd: directory,
    });
    cp.execSync(`npx tsc -p ${directory}/test/tsconfig.json`, {
      stdio: "ignore",
      cwd: directory,
    });
  });

const iterate = async (directory: string): Promise<void> => {
  const filter = (() => {
    const only = process.argv.findIndex((str) => str === "--only");
    if (only !== -1 && process.argv.length >= only + 1)
      return (str: string) => str.includes(process.argv[only + 1]);
    return () => true;
  })();

  for (const file of await fs.promises.readdir(directory)) {
    const location: string = `${directory}/${file}`;
    if (fs.statSync(location).isDirectory()) await iterate(location);
    else if (location.endsWith(".json")) {
      const project: string = file.substring(0, file.length - 5);
      if (filter(project) === false) continue;
      const document:
        | SwaggerV2.IDocument
        | OpenApiV3.IDocument
        | OpenApiV3_1.IDocument = JSON.parse(
        await fs.promises.readFile(location, "utf8"),
      );
      for (const [mode, flag] of [
        ["nest", true],
        ["sdk", true],
        ["sdk", false],
      ] as const)
        await execute(
          mode,
          {
            simulate: flag,
            e2e: flag,
          },
          project,
          document,
        );
    }
  }
};

const main = async () => {
  if (fs.existsSync(OUTPUT)) await fs.promises.rm(OUTPUT, { recursive: true });
  await fs.promises.mkdir(OUTPUT);
  await iterate(INPUT);
};
main();
