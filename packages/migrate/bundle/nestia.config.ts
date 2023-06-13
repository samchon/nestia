import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
    primitive: false,
    simulate: true,
    input: "src/controllers",
    output: "src/api",
    e2e: "test",
    swagger: {
        output: "dist/swagger.json",
    },
};
export default NESTIA_CONFIG;
