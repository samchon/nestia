import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: ["src/controllers"],
  output: "generated/sdk/api",
  e2e: "generated/tests/e2e",
  swagger: {
    output: "generated/documents/openapi/swagger.json",
  },
};
export default NESTIA_CONFIG;
