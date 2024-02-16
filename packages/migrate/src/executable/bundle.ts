import cp from "child_process";
import fs from "fs";

import { IMigrateFile } from "../structures/IMigrateFile";

const ROOT: string = `${__dirname}/../..`;
const ASSETS: string = `${ROOT}/assets`;

const bundle = async (props: {
  mode: "nest" | "sdk";
  repository: string;
  exceptions?: string[];
}): Promise<void> => {
  const root: string = `${__dirname}/../..`;
  const assets: string = `${root}/assets`;
  const template: string = `${assets}/${props.mode}`;

  const clone = async () => {
    // CLONE REPOSITORY
    if (fs.existsSync(template))
      await fs.promises.rm(template, { recursive: true });
    else
      try {
        await fs.promises.mkdir(ASSETS);
      } catch {}

    cp.execSync(
      `git clone https://github.com/samchon/${props.repository} ${props.mode}`,
      {
        cwd: ASSETS,
      },
    );

    // REMOVE VUNLERABLE FILES
    for (const location of props.exceptions ?? [])
      await fs.promises.rm(`${template}/${location}`, { recursive: true });
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
          location: (() => {
            const str: string = location.replace(template, "");
            return str[0] === "/" ? str.substring(1) : str;
          })(),
          file,
          content,
        });
      }
    }
  };

  const archive = async (collection: IMigrateFile[]): Promise<void> => {
    const name: string = `${props.mode.toUpperCase()}_TEMPLATE`;
    const body: string = JSON.stringify(collection, null, 2);
    const content: string = `export const ${name} = ${body}`;

    try {
      await fs.promises.mkdir(`${ROOT}/src/bundles`);
    } catch {}
    await fs.promises.writeFile(
      `${ROOT}/src/bundles/${name}.ts`,
      content,
      "utf8",
    );
  };

  const collection: IMigrateFile[] = [];
  await clone();
  await iterate(collection)(template);
  await archive(collection);
};

const main = async (): Promise<void> => {
  await bundle({
    mode: "nest",
    repository: "nestia-start",
    exceptions: [
      ".git",
      ".github/dependabot.yml",
      "src/api/functional",
      "src/controllers",
      "src/MyModule.ts",
      "src/providers",
      "test/features",
    ],
  });
  await bundle({
    mode: "sdk",
    repository: "nestia-sdk-template",
    exceptions: [
      ".git",
      ".github/dependabot.yml",
      ".github/workflows/build.yml",
      "src/functional",
      "src/structures",
      "test/features",
    ],
  });
};
main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
