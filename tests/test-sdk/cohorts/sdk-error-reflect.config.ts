import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: [
    "features/body-error-get/src/controllers",
    "features/body-error-property/src/controllers",
    "features/headers-error-plain/src/controllers",
    "features/mcp-error-mixed-http/src/controllers",
    "features/method-error-get-body/src/controllers",
    "features/method-error-head-body/src/controllers",
    "features/param-error-plain/src/controllers",
    "features/parameter-error-duplicated-key/src/controllers",
    "features/query-error-plain/src/controllers",
    "features/route-invalid-path-error/src/controllers",
  ],
  output: ".tmp-sdk-error-reflect",
};
export default NESTIA_CONFIG;
