import { INestiaConfig } from "@nestia/sdk";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./src/app.module";
export const NESTIA_CONFIG: INestiaConfig = {
  input: ()=> NestFactory.create(AppModule),
  output: "src/api",
  e2e: "src/test",
  swagger: {
    output: "swagger.json",
    info: {
      title: "Nestia Swagger Generation Test",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Server",
      },
    ],
    security: {
      bearer: {
        type: "apiKey",
      },
    },
  },
};
export default NESTIA_CONFIG;
