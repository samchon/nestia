import { INestiaConfig } from "@nestia/sdk";

// `simulate` and `e2e` generate more code over each parameter's name.
export const NESTIA_CONFIG: INestiaConfig = {
  input: ["src/controllers"],
  output: "src/api",
  e2e: "src/test",
  simulate: true,
  keyword: true,
};
export default NESTIA_CONFIG;
