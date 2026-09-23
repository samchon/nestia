import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIGURATIONS: INestiaConfig[] = [
  {
    input: ["src/controllers"],
    output: "src/api",
    swagger: {
      output: "swagger.json",
      beautify: true,
      security: {
        bearer: {
          type: "apiKey",
        },
      },
    },
  },
  // Swagger 2.0 has no named examples and no request body example
  {
    input: ["src/controllers"],
    swagger: {
      output: "v2.swagger.json",
      beautify: true,
      openapi: "2.0",
    },
  },
];
export default NESTIA_CONFIGURATIONS;
