import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
    input: ["src/controllers"],
    output: "src/api",
    e2e: "src/test",
    swagger: {
        output: "swagger.json",
        security: {
            oauth2: {
                type: "oauth2",
                flows: {
                    implicit: {
                        authorizationUrl: "https://example.com/api/oauth/dialog",
                        refreshUrl: "https://example.com/api/oauth/refresh",
                        scopes: {
                            "write:pets": "modify pets in your account",
                        }
                    }
                }
            }
        },
    },
};
export default NESTIA_CONFIG;
