import { IConfiguration } from "../../src/IConfiguration";

export const NESTIA_CONFIG: IConfiguration = {
    input: ["src/controllers"],
    output: "src/api",
    swagger: {
        output: "swagger.json",
    },
    compilerOptions: {
        noUnusedParameters: false,
    },
};
export default NESTIA_CONFIG;
