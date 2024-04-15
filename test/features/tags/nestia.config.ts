import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: ["src/controllers"],
  output: "src/api",
  e2e: "src/test",
  swagger: {
    output: "swagger.json",
    beautify: true,
    operationId: (props) => `${props.class}.${props.function}`,
    security: {
      //----
      // YOU CAN CHOOSE ANY SECURITY SCHEMES LIKE
      //----
      // @security basic
      // @security bearer
      // @security oauth2 read write
      // @security custom
      basic: {
        type: "http",
        scheme: "basic",
      },
      bearer: {
        type: "http",
        scheme: "bearer",
      },
      oauth2: {
        type: "oauth2",
        flows: {
          implicit: {
            authorizationUrl: "https://example.com/api/oauth/dialog",
            refreshUrl: "https://example.com/api/oauth/refresh",
            scopes: {
              //----
              // YOU CAN CHOOSE ANY SCOPES
              //----
              // (@security oauth2 read write) -> BOTH OF THEM
              // (@security oauth2 read) -> ONE OF THEM
              // (@security oauth) -> NOTHING
              read: "read authority",
              write: "write authority",
            },
          },
        },
      },
      custom: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
      },
    },
  },
};
export default NESTIA_CONFIG;
