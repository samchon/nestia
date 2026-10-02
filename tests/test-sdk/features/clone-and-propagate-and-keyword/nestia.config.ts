import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: ["src/controllers"],
  output: "src/api",
  e2e: "src/test",
  keyword: true,
  clone: true,
  propagate: true,
  simulate: true,
  swagger: {
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
