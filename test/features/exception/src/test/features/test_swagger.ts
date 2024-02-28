import { TestValidator } from "@nestia/e2e";

export const test_swagger = async () => {
  const content = await import("../../../swagger.json");
  for (const [key, value] of [
    [201, "IBbsArticle"],
    [400, "TypeGuardError"],
    [404, "INotFound"],
    [428, "IUnprocessibleEntity"],
    ["5XX", "IInternalServerError"],
  ] as const)
    TestValidator.equals(key.toString())(
      content.paths["/exception/{section}/typed"].post.responses[key].content[
        "application/json"
      ].schema.$ref,
    )(`#/components/schemas/${value}`);
  TestValidator.equals("union")(
    content.paths["/exception/{section}/union"].get.responses[428].content[
      "application/json"
    ].schema,
  )({
    oneOf: [
      { $ref: "#/components/schemas/IExceptional.Something" },
      { $ref: "#/components/schemas/IExceptional.Nothing" },
      { $ref: "#/components/schemas/IExceptional.Everything" },
    ],
  });
};
