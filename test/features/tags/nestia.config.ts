import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
    input: ["src/controllers"],
    output: "src/api",
    e2e: "src/test",
    swagger: {
        output: "swagger.json",
    },
};
export default NESTIA_CONFIG;
