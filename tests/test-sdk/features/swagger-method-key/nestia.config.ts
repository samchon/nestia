import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: ["src/controllers"],
  output: "src/api",
  swagger: {
    output: "swagger.json",
    beautify: true,
    operationId: (props) => `${props.class}.${props.function}`,
  },
};
export default NESTIA_CONFIG;
