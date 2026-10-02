import fs from "fs";
import path from "path";

import { ITypedApplication } from "../structures/ITypedApplication";
import { E2eFileProgrammer } from "./internal/E2eFileProgrammer";

/**
 * Writes the e2e test functions of the SDK.
 *
 * @evidence contracts/common.md#principled-implementation The namespace creates the output directories and writes one test file per HTTP route.
 * @evidence contracts/common.md#clear-and-simple-design One public function and one directory helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only HTTP routes have a test, and no route is skipped by name.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
 * @evidence contracts/portability.md#os-neutral-implementation The output root is resolved with Node path.resolve, descendants use path.join and recursive fs.mkdir creates them. SDK import paths are passed to E2eFileProgrammer independently from native directory paths.
 */
export namespace E2eGenerator {
  /**
   * Writes one test function per HTTP route under `features/api/automated` of
   * the e2e output directory, creating the directories as needed.
   *
   * @evidence contracts/common.md#principled-implementation The directories are created recursively, so an existing tree is reused, and each route's file is written in sequence.
   * @evidence contracts/common.md#clear-and-simple-design One loop over the routes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts WebSocket and MCP routes are not tests of the HTTP SDK and are left out by protocol.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidence contracts/portability.md#os-neutral-implementation Native output and SDK roots use path.resolve and path.join before mkdir or file generation. No shell or filesystem case assumption participates; the generated HTTP route names have already passed accessor analysis.
   */
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
  await fs.promises.mkdir(location, { recursive: true });
};
