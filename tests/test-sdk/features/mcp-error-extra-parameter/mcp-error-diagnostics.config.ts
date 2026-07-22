import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: [
    "features/mcp-error-extra-parameter/src/controllers",
    "features/mcp-error-missing-params-decorator/src/controllers",
    "features/mcp-error-multiple-params/src/controllers",
    "features/mcp-error-no-params/src/controllers",
    "features/mcp-error-param-dynamic-properties/src/controllers",
    "features/mcp-error-param-non-object/src/controllers",
    "features/mcp-error-return-dynamic-properties/src/controllers",
    "features/mcp-error-return-non-object/src/controllers",
    "features/mcp-error-return-union-void-object/src/controllers",
  ],
  output: ".tmp-mcp-error-diagnostics",
};
export default NESTIA_CONFIG;
