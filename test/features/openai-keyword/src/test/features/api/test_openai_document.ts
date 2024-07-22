import { TestValidator } from "@nestia/e2e";
import { IOpenAiDocument, IOpenAiSchema } from "@wrtnio/openai-function-schema";
import fs from "fs";
import typia from "typia";

export const test_openai_document = async (): Promise<void> => {
  const document: IOpenAiDocument = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../../openai.json`, "utf8"),
  );
  typia.assert(document);

  TestValidator.equals("options")(document.options)({
    keyword: true,
    separate: null,
  });
  TestValidator.equals("parameters")(
    document.functions
      .find(
        (func) => func.path === "/bbs/articles/{id}" && func.method === "put",
      )
      ?.parameters.map((p) => (p as IOpenAiSchema.IObject).type),
  )(["object"]);
};
