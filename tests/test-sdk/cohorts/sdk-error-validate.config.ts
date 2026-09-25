import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: [
    "features/implicit-error/src/controllers",
    "features/mcp-error-duplicate-accessor/src/controllers",
    "features/mcp-error-duplicate-tool-name/src/controllers",
    "features/route-error-implicit/src/controllers",
    "features/exception-error-bigint/src/controllers",
    "features/method-error-head-non-void/src/controllers",
  ],
  output: ".tmp-sdk-error-validate",
};
export default NESTIA_CONFIG;
