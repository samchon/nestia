import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: ["features/security-error-not-found/src/controllers"],
  output: ".tmp-sdk-error-security",
  swagger: {
    output: ".tmp-sdk-error-security/swagger.json",
    openapi: "3.0",
    security: {
      bearer: { type: "apiKey" },
    },
  },
};
export default NESTIA_CONFIG;
