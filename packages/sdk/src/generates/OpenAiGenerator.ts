import { OpenApi } from "@samchon/openapi";
import {
  IOpenAiDocument,
  OpenAiComposer,
} from "@wrtnio/openai-function-schema";
import fs from "fs";
import path from "path";

import { ITypedApplication } from "../structures/ITypedApplication";
import { SwaggerGenerator } from "./SwaggerGenerator";

export namespace OpenAiGenerator {
  export const generate = async (app: ITypedApplication): Promise<void> => {
    console.log("Generating OpenAI Function Calling Document");

    const config = app.project.config.openai;
    if (config === undefined)
      throw new Error("OpenAI configuration is not defined");

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
      config: app.project.config.swagger ?? { output: "" },
      routes: app.routes.filter((route) => route.protocol === "http"),
      document: {
        openapi: "3.1.0",
        components: {},
        "x-samchon-emended": true,
      },
    });
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
