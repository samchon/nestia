import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";

import { NestiaEditorModule } from "../src/NestiaEditorModule";

@Module({})
class MyModule {}

const main = async (): Promise<void> => {
  const app = await NestFactory.create(MyModule, new FastifyAdapter(), {
    logger: false,
  });
  await NestiaEditorModule.setup({
    path: "editor",
    application: app,
    swagger:
      "https://raw.githubusercontent.com/samchon/openapi/refs/heads/master/examples/v3.1/shopping.json",
  });
  await app.listen(3_001);
};
main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
