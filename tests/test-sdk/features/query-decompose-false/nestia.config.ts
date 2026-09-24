import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIGURATIONS: INestiaConfig[] = [
  {
    input: ["src/controllers"],
    output: "src/api",
    swagger: {
      output: "swagger.json",
      beautify: true,
      decompose: false,
      security: {
        bearer: {
          type: "apiKey",
        },
      },
    },
  },
  // Swagger 2.0 cannot hold an object query parameter
  {
    input: ["src/controllers"],
    swagger: {
      output: "v2.swagger.json",
      beautify: true,
      decompose: false,
      openapi: "2.0",
    },
  },
];
export default NESTIA_CONFIGURATIONS;
