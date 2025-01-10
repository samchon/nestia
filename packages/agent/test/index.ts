import { NestiaAgent } from "@nestia/agent";
import { DynamicExecutor } from "@nestia/e2e";
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
  application.functions = application.functions.filter((f) =>
    f.path.startsWith("/shoppings/customers"),
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
  const agent: NestiaAgent = new NestiaAgent({
    provider: {
      type: "chatgpt",
      api: new OpenAI({
        apiKey: TestGlobal.env.CHATGPT_API_KEY,
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

  const report: DynamicExecutor.IReport = await DynamicExecutor.validate({
    prefix: "test_",
    location: __dirname + "/features",
    parameters: () => [agent],
    onComplete: (exec) => {
      const trace = (str: string) =>
        console.log(`  - ${chalk.green(exec.name)}: ${str}`);
      if (exec.error === null) {
        const elapsed: number =
          new Date(exec.completed_at).getTime() -
          new Date(exec.started_at).getTime();
        trace(`${chalk.yellow(elapsed.toLocaleString())} ms`);
      } else trace(chalk.red(exec.error.name));
    },
  });

  const exceptions: Error[] = report.executions
    .filter((exec) => exec.error !== null)
    .map((exec) => exec.error!);
  if (exceptions.length === 0) {
    console.log("Success");
    console.log("Elapsed time", report.time.toLocaleString(), `ms`);
  } else {
    for (const exp of exceptions) console.log(exp);
    console.log("Failed");
    console.log("Elapsed time", report.time.toLocaleString(), `ms`);
    process.exit(-1);
  }
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
