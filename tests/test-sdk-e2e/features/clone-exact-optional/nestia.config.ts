import { INestiaConfig } from "@nestia/sdk";

const config: INestiaConfig = {
  input: ["src/controllers"],
  output: "src/api",
  e2e: "src/test",
  clone: true,
  simulate: true,
  swagger: { output: "swagger.json", beautify: true },
};
export default config;
