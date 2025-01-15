import { NestiaAgent } from "@nestia/agent";
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
import OpenAI from "openai";
import { createRoot } from "react-dom/client";

import { NestiaChatApplication } from "./NestiaChatApplication";

const main = async (): Promise<void> => {
  // COMPOSE LLM APPLICATION SCHEMA
  const swagger:
    | SwaggerV2.IDocument
    | OpenApiV3.IDocument
    | OpenApiV3_1.IDocument = await fetch(
    "https://raw.githubusercontent.com/samchon/shopping-backend/refs/heads/master/packages/api/swagger.json",
  ).then((r) => r.json());
  const document: OpenApi.IDocument = OpenApi.convert(swagger);
  const application: IHttpLlmApplication<"chatgpt"> = HttpLlm.application({
    model: "chatgpt",
    document,
  });
  application.functions = application.functions.filter((f) =>
    f.path.startsWith("/shoppings/customers"),
  );

  // HANDSHAKE WITH SHOPPING BACKEND
  const connection: IHttpConnection = {
    host: "https://shopping-be.wrtn.ai/",
  };
  await ShoppingApi.functional.shoppings.customers.authenticate.create(
    connection,
    {
      channel_code: "samchon",
      external_user: null,
      href: "https://127.0.0.1/NodeJS",
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
  const agent: NestiaAgent = new NestiaAgent({
    provider: {
      type: "chatgpt",
      api: new OpenAI({
        apiKey: import.meta.env.VITE_CHATGPT_API_KEY,
        dangerouslyAllowBrowser: true,
      }),
      model: "gpt-4o",
    },
    controllers: [
      {
        protocol: "http",
        name: "shopping",
        application,
        connection,
      },
    ],
  });
  createRoot(window.document.getElementById("root")!).render(
    <NestiaChatApplication agent={agent} />,
  );
};
main().catch(console.error);
