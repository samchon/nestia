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
    separate: undefined!,
  });
  TestValidator.equals("parameters")(
    document.functions
      .find(
        (func) => func.path === "/bbs/articles/{id}" && func.method === "put",
      )
      ?.parameters.map((p) => (p as IOpenAiSchema.IObject).type),
  )(["object"]);
  TestValidator.equals("separated.human")(
    document.functions.find(
      (func) => func.path === "/bbs/articles/{id}" && func.method === "put",
    )?.separated?.human,
  )([
    {
      index: 0,
      schema: {
        type: "object",
        properties: {
          body: {
            type: "object",
            properties: {
              files: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    url: {
                      type: "string",
                      format: "uri",
                      contentMediaType: "image/*",
                      title: "URL path of the real file",
                      description: "URL path of the real file.",
                    },
                  },
                  required: ["url"],
                },
                title: "List of attachment files",
                description: "List of attachment files.",
              },
            },
            required: ["files"],
          },
        },
      },
    },
  ]);
};
