import { INestiaConfig } from "@nestia/sdk";

import { Backend } from "./src/Backend";

export const NESTIA_CONFIG: INestiaConfig = {
  input: () => Backend.create(),
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
