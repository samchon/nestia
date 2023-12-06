import cp from "child_process";
import fs from "fs";

import { IMigrateFile } from "../structures/IMigrateFile";

const ROOT = __dirname + "/../..";
const ASSETS = ROOT + "/assets";
const TEMPLATE = ASSETS + "/template";

const clone = async (): Promise<void> => {
  console.log("Preparing bundles...");

  // CLONE REPOSITORY
  if (fs.existsSync(TEMPLATE))
    await fs.promises.rm(TEMPLATE, { recursive: true });
  else
    try {
      await fs.promises.mkdir(ASSETS);
    } catch {}

  cp.execSync("git clone https://github.com/samchon/nestia-template template", {
    cwd: __dirname + "/../../assets",
  });

  // REMOVE VUNLERABLE FILES
  for (const path of [
    `${TEMPLATE}/.git`,
    `${TEMPLATE}/src/api`,
    `${TEMPLATE}/src/controllers`,
    `${TEMPLATE}/src/providers`,
    `${TEMPLATE}/test/features`,
  ])
    await fs.promises.rm(path, { recursive: true });
};

const iterate = (collection: IMigrateFile[]) => async (location: string) => {
  const directory: string[] = await fs.promises.readdir(location);
  for (const file of directory) {
    const absolute: string = location + "/" + file;
    const stats: fs.Stats = await fs.promises.stat(absolute);
    if (stats.isDirectory()) await iterate(collection)(absolute);
    else {
      const content: string = await fs.promises.readFile(absolute, "utf-8");
      collection.push({
        location: location.replace(TEMPLATE, ""),
        file,
        content,
      });
    }
  }
};

const archive = async (collection: IMigrateFile[]): Promise<void> => {
  const body: string = JSON.stringify(collection, null, 4);
  const content: string = `export const TEMPLATE = ${body}`;

  try {
    await fs.promises.mkdir(`${ROOT}/src/bundles`);
  } catch {}
  await fs.promises.writeFile(`${ROOT}/src/bundles/TEMPLATE.ts`, content);
};

const main = async (): Promise<void> => {
  const collection: IMigrateFile[] = [];
  await clone();
  await iterate(collection)(TEMPLATE);
  await archive(collection);
};
main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
