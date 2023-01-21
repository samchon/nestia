import { INestiaConfig } from "../../src/INestiaConfig";

export const NESTIA_CONFIG: INestiaConfig = {
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
    compilerOptions: {
        noUnusedParameters: false,
    },
};
export default NESTIA_CONFIG;
