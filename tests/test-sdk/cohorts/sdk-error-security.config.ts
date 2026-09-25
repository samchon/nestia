import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: [
    "features/security-error-not-found/src/controllers",
    "features/security-error-not-oauth2/src/controllers",
    "features/security-error-out-of-scopes/src/controllers",
  ],
  output: ".tmp-sdk-error-security",
  swagger: {
    output: ".tmp-sdk-error-security/swagger.json",
    openapi: "3.0",
    security: {
      bearer: { type: "apiKey" },
      oauth2: {
        type: "oauth2",
        flows: {
          implicit: {
            authorizationUrl: "https://example.com/api/oauth/dialog",
            refreshUrl: "https://example.com/api/oauth/refresh",
            scopes: { "write:pets": "modify pets in your account" },
          },
        },
      },
    },
  },
};
export default NESTIA_CONFIG;
