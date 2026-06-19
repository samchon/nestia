import { INestiaConfig } from "@nestia/sdk";
import { NestFactory } from "@nestjs/core";

import { ApplicationModule } from "./src/modules/ApplicationModule";

export const NESTIA_CONFIG: INestiaConfig = {
  input: () =>
    NestFactory.create(ApplicationModule, {
      logger: false,
    }),
  output: "src/api",
  e2e: "src/test",
  swagger: {
    output: "swagger.json",
    beautify: true,
    security: {
      bearer: {
        type: "apiKey",
      },
    },
  },
};
export default NESTIA_CONFIG;
