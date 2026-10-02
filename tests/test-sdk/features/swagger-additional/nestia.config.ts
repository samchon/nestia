import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: ["src/controllers"],
  swagger: {
    output: "swagger.json",
    additional: true,
  },
};
export default NESTIA_CONFIG;
