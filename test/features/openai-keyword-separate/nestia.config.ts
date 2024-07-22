import { INestiaConfig } from "@nestia/sdk";
import { OpenAiTypeChecker } from "@wrtnio/openai-function-schema";

export const NESTIA_CONFIG: INestiaConfig = {
  input: ["src/controllers"],
  openai: {
    output: "./openai.json",
    beautify: true,
    keyword: true,
    separate: (schema) =>
      OpenAiTypeChecker.isString(schema) &&
      !!schema.contentMediaType?.startsWith("image/"),
  },
};
export default NESTIA_CONFIG;
