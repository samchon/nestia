import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: ["src/controllers"],
  swagger: {
    output: "swagger.json",
    security: {
      bearer: {
        type: "http",
        scheme: "bearer",
      },
      key: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
      },
      oauth2: {
        type: "oauth2",
        flows: {
          implicit: {
            authorizationUrl: "https://example.com/oauth/dialog",
            scopes: {
              read: "read the records",
              write: "write the records",
            },
          },
        },
      },
    },
  },
};
export default NESTIA_CONFIG;
