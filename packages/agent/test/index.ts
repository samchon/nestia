import { INestiaChatPrompt, NestiaChatAgent } from "@nestia/agent";
import {
  HttpLlm,
  IHttpLlmApplication,
  OpenApi,
  OpenApiV3,
  OpenApiV3_1,
  SwaggerV2,
} from "@samchon/openapi";
import chalk from "chalk";
import OpenAI from "openai";
import typia from "typia";

import { ConsoleScanner } from "./utils/ConsoleScanner";

const trace = (...args: any[]): void => {
  console.log("----------------------------------------------");
  console.log(...args);
  console.log("----------------------------------------------");
};

const main = async (): Promise<void> => {
  const swagger:
    | SwaggerV2.IDocument
    | OpenApiV3.IDocument
    | OpenApiV3_1.IDocument = JSON.parse(
    await fetch(
      "https://raw.githubusercontent.com/samchon/shopping-backend/refs/heads/master/packages/api/swagger.json",
    ).then((r) => r.json()),
  );
  const document: OpenApi.IDocument = OpenApi.convert(typia.assert(swagger));
  const application: IHttpLlmApplication<"chatgpt"> = HttpLlm.application({
    model: "chatgpt",
    document,
  });
  application.functions = application.functions.filter((f) =>
    f.path.startsWith("/shoppings/customers"),
  );

  const agent: NestiaChatAgent = new NestiaChatAgent({
    service: {
      api: new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      }),
      model: "chatgpt-4o-latest",
    },
    connection: {
      host: "http://localhost:37001",
    },
    application,
  });
  while (true) {
    const content: string = await ConsoleScanner.read("Input: ");
    if (content === "exit") break;

    const histories: INestiaChatPrompt[] = await agent.conversate(content);
    for (const h of histories) {
      if (h.kind === "text") {
        trace(chalk.yellow("Text"), chalk.blueBright(h.role), "\n\n", h.text);
      } else {
        trace(
          chalk.yellow("Function " + h.function.name),
          "\n\n",
          "```json",
          JSON.stringify(h.input, null, 2),
          "```",
          "\n\n",
          "````",
          JSON.stringify(h.response, null, 2),
          "```",
        );
      }
    }
  }
};
main().catch((error) => {
  console.log(error);
  process.exit(-1);
});
