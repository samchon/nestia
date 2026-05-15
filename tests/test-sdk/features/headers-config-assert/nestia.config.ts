import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: ["src/controllers"],
  output: "src/api",
  simulate: true,
  e2e: "src/test",
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
};
export default NESTIA_CONFIG;
