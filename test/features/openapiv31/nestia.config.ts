import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: ["src/controllers"],
  output: "src/api",
  e2e: "src/test",
  swagger: {
    openapi: "3.1",
    output: "swagger.json",
    security: {
      bearer: {
        type: "apiKey",
      },
    },
    beautify: true,
  },
};
export default NESTIA_CONFIG;
