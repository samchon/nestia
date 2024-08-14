import fs from "fs";
import path from "path";

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

    // GENERATE EACH TEST FILES
    for (const route of app.routes)
      if (route.protocol === "http")
        await E2eFileProgrammer.generate(app.project)({
          api: path.resolve(app.project.config.output!),
          current: path.join(output, "features", "api", "automated"),
        })(route);
  };
}

const mkdir = async (location: string): Promise<void> => {
  try {
    await fs.promises.mkdir(location);
  } catch {}
};
