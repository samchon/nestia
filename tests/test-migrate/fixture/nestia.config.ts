import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: ["src/controllers"],
  swagger: {
    output: "../.generated/swagger.json",
    beautify: true,
    decompose: true,
    openapi: "3.1",
    security: {
      bearer: {
        type: "http",
        scheme: "bearer",
      },
      apiKey: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
      },
    },
  },
};
export default NESTIA_CONFIG;
