import { TestValidator } from "@nestia/e2e";

export const test_swagger = async () => {
  const content = await import("../../../swagger.json");
  TestValidator.equals("query")({
    name: "query",
    in: "query",
    schema: { $ref: "#/components/schemas/IQuery" },
    required: true,
  })(
    content.paths["/query/typed"].get.parameters.find((p) => p.in === "query")!,
  );
};
