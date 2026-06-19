import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: ["src/controllers"],
  output: "src/api",
  swagger: {
    output: "swagger.json",
    decompose: true,
    security: {
      bearer: {
        type: "apiKey",
      },
    },
  },
};
export default NESTIA_CONFIG;
