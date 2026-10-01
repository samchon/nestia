import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: ["src/controllers"],
  output: "src/api",
  propagate: true,
  clone: true,
  primitive: true,
  json: false,
  swagger: {
    output: "swagger.json",
    security: {
      bearer: {
        type: "http",
        scheme: "bearer",
      },
    },
  },
};
export default NESTIA_CONFIG;
