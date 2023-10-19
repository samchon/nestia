import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
    project: "tsconfig.nestia.json",
    input: ["src/controllers"],
    output: "src/api",
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
