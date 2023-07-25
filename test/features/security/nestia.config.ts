import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
    input: ["src/controllers"],
    output: "src/api",
    e2e: "src/test",
    swagger: {
        output: "swagger.json",
        security: {
            basic: {
                type: "http",
                schema: "basic",
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
                            "write:pets": "modify pets in your account",
                            "read:pets": "read your pets",
                        }
                    }
                }
            },
            security: {
                type: "oauth2",
                flows: {
                    clientCredentials: {
                        tokenUrl: "https://example.com/api/oauth/dialog",
                        refreshUrl: "https://example.com/api/oauth/refresh",
                        scopes: {
                            "x1": "x1",
                            "x2": "x2",
                        },
                    },
                },
            },
        },
    },
};
export default NESTIA_CONFIG;
