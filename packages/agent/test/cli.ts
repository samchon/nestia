import { INestiaChatPrompt, NestiaChatAgent } from "@nestia/agent";
import {
  HttpLlm,
  IHttpConnection,
  IHttpLlmApplication,
  OpenApi,
  OpenApiV3,
  OpenApiV3_1,
  SwaggerV2,
} from "@samchon/openapi";
import ShoppingApi from "@samchon/shopping-api";
import chalk from "chalk";
import OpenAI from "openai";
import typia from "typia";

import { TestGlobal } from "./TestGlobal";
import { ConsoleScanner } from "./utils/ConsoleScanner";

const trace = (...args: any[]): void => {
  console.log("----------------------------------------------");
  console.log(...args);
  console.log("----------------------------------------------");
};

const main = async (): Promise<void> => {
  if (!TestGlobal.env.CHATGPT_API_KEY?.length) return;

  // GET LLM APPLICATION SCHEMA
  const swagger:
    | SwaggerV2.IDocument
    | OpenApiV3.IDocument
    | OpenApiV3_1.IDocument = await fetch(
    "https://raw.githubusercontent.com/samchon/shopping-backend/refs/heads/master/packages/api/swagger.json",
  ).then((r) => r.json());
  const document: OpenApi.IDocument = OpenApi.convert(typia.assert(swagger));
  const application: IHttpLlmApplication<"chatgpt"> = HttpLlm.application({
    model: "chatgpt",
    document,
  });
  application.functions = application.functions.filter(
    (f) =>
      // f.path.startsWith("/shoppings/customers"),
      f.path === "/shoppings/customers/sales" && f.method === "patch",
  );

  // HANDSHAKE WITH SHOPPING BACKEND
  const connection: IHttpConnection = {
    host: "http://localhost:37001",
  };
  await ShoppingApi.functional.shoppings.customers.authenticate.create(
    connection,
    {
      channel_code: "samchon",
      external_user: null,
      href: "htts://127.0.0.1/NodeJS",
      referrer: null,
    },
  );
  await ShoppingApi.functional.shoppings.customers.authenticate.activate(
    connection,
    {
      mobile: "821012345678",
      name: "John Doe",
    },
  );

  // COMPOSE CHAT AGENT
  const agent: NestiaChatAgent = new NestiaChatAgent({
    service: {
      api: new OpenAI({
        apiKey: TestGlobal.env.CHATGPT_API_KEY,
      }),
      model: "gpt-4o",
    },
    connection,
    application,
  });
  agent.on("initialize", () => console.log(chalk.greenBright("Initialized")));
  agent.on("select", (e) =>
    console.log(chalk.cyanBright("selected"), e.function.name),
  );
  agent.on("call", (e) =>
    console.log(chalk.blueBright("called"), e.function.name),
  );
  agent.on("cancel", (e) =>
    console.log(chalk.redBright("canceled"), e.function.name),
  );

  // START CONVERSATION
  while (true) {
    const content: string = await ConsoleScanner.read("Input: ");
    if (content === "exit") break;

    const histories: INestiaChatPrompt[] = await agent.conversate(content);
    for (const h of histories)
      if (h.kind === "text")
        trace(chalk.yellow("Text"), chalk.blueBright(h.role), "\n\n", h.text);
  }
};
main().catch((error) => {
  console.log(error);
  process.exit(-1);
});
