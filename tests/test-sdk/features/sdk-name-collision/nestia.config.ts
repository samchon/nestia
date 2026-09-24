import { INestiaConfig } from "@nestia/sdk";

// `simulate`, `assert`, and `json` each make the generated code reference more
// fixed names (`path`, `random`, `typia`, `<route>.stringify`), so all are on.
export const NESTIA_CONFIG: INestiaConfig = {
  input: ["src/controllers"],
  output: "src/api",
  e2e: "src/test",
  simulate: true,
  assert: true,
  json: true,
};
export default NESTIA_CONFIG;
