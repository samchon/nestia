import { INestiaConfig } from "@nestia/sdk";

import { Backend } from "./src/Backend";

export const NESTIA_CONFIG: INestiaConfig = {
  input: () => new Backend().application.get(),
  output: "src/api",
  swagger: {
    output: "swagger.json",
  },
};
export default NESTIA_CONFIG;
