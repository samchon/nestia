import { INestiaConfig } from "@nestia/sdk";
import { NestFactory } from "@nestjs/core";

import { MyModule } from "./src/controllers/MyModule";

export const NESTIA_CONFIG: INestiaConfig = {
  input: () => NestFactory.create(MyModule),
  output: "src/api",
  e2e: "src/test",
  swagger: {
    output: "swagger.json",
    security: {
      bearer: {
        type: "apiKey",
      },
    },
  },
};
export default NESTIA_CONFIG;
