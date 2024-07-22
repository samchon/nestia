import { OpenApi } from "@samchon/openapi";
import {
  IOpenAiDocument,
  OpenAiComposer,
} from "@wrtnio/openai-function-schema";
import fs from "fs";
import path from "path";

import { INestiaProject } from "../structures/INestiaProject";
import { ITypedHttpRoute } from "../structures/ITypedHttpRoute";
import { ITypedWebSocketRoute } from "../structures/ITypedWebSocketRoute";
import { SwaggerGenerator } from "./SwaggerGenerator";

export namespace OpenAiGenerator {
  export const generate =
    (project: INestiaProject) =>
    async (
      routes: Array<ITypedHttpRoute | ITypedWebSocketRoute>,
    ): Promise<void> => {
      console.log("Generating OpenAI Function Calling Document");

      const config = project.config.openai!;
      const parsed: path.ParsedPath = path.parse(config.output);
      const directory: string = path.dirname(parsed.dir);
      if (fs.existsSync(directory) === false)
        try {
          await fs.promises.mkdir(directory);
        } catch {}
      if (fs.existsSync(directory) === false)
        throw new Error(
          `Error on NestiaApplication.openai(): failed to create output directory: ${directory}`,
        );

      const location: string = !!parsed.ext
        ? path.resolve(config.output)
        : path.join(path.resolve(config.output), "openai.json");
      const swagger: OpenApi.IDocument = await SwaggerGenerator.compose({
        ...project,
        config: {
          ...project.config,
          swagger: project.config.swagger ?? { output: "" },
        },
      })(routes);
      const document: IOpenAiDocument = OpenAiComposer.document({
        swagger,
        options: config,
      });
      await fs.promises.writeFile(
        location,
        !config.beautify
          ? JSON.stringify(document)
          : JSON.stringify(
              document,
              null,
              typeof config.beautify === "number" ? config.beautify : 2,
            ),
        "utf8",
      );
    };
}
