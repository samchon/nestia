import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: ["src/controllers"],
  openai: {
    output: "./openai.json",
    beautify: true,
    keyword: true,
  },
};
export default NESTIA_CONFIG;
