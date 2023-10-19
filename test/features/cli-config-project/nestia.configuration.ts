import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
    input: ["src/controllers"],
    output: "src/api",
    e2e: "src/test",
    simulate: true,
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
