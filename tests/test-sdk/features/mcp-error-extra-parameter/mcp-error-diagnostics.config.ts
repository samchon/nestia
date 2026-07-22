import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: [
    "features/mcp-error-extra-parameter/src",
    "features/mcp-error-missing-params-decorator/src",
    "features/mcp-error-multiple-params/src",
    "features/mcp-error-no-params/src",
    "features/mcp-error-param-dynamic-properties/src",
    "features/mcp-error-param-non-object/src",
    "features/mcp-error-return-dynamic-properties/src",
    "features/mcp-error-return-non-object/src",
    "features/mcp-error-return-union-void-object/src",
  ],
  output: ".tmp-mcp-error-diagnostics",
};
export default NESTIA_CONFIG;
