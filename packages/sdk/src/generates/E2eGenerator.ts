import fs from "fs";
import path from "path";

import { ConfigAnalyzer } from "../analyses/ConfigAnalyzer";
import { INestiaProject } from "../structures/INestiaProject";
import { ITypedApplication } from "../structures/ITypedApplication";
import { E2eFileProgrammer } from "./internal/E2eFileProgrammer";

export namespace E2eGenerator {
  export const generate = async (app: ITypedApplication): Promise<void> => {
    console.log("Generating E2E Test Functions");

    // PREPARE DIRECTORIES
    const output: string = path.resolve(app.project.config.e2e!);
    await mkdir(output);
    await mkdir(path.join(output, "features"));
    await mkdir(path.join(output, "features", "api"));
    await mkdir(path.join(output, "features", "api", "automated"));

    // GENERATE TEST INDEX FILE
    await index(app.project)(path.join(app.project.config.e2e!, "index.ts"));

    // GENERATE EACH TEST FILES
    for (const route of app.routes)
      if (route.protocol === "http")
        await E2eFileProgrammer.generate(app.project)({
          api: path.resolve(app.project.config.output!),
          current: path.join(output, "features", "api", "automated"),
        })(route);
  };

  const index =
    (project: INestiaProject) =>
    async (output: string): Promise<void> => {
      if (fs.existsSync(output)) return;

      const location: string = path.join(
        __dirname,
        "..",
        "..",
        "assets",
        "bundle",
        "e2e",
        "index.ts",
      );
      const content: string = await fs.promises.readFile(location, "utf8");

      await fs.promises.writeFile(
        output,
        content.replace(
          "${input}",
          JSON.stringify(await ConfigAnalyzer.input(project.config)),
        ),
        "utf8",
      );
    };
}

const mkdir = async (location: string): Promise<void> => {
  try {
    await fs.promises.mkdir(location);
  } catch {}
};
