import { TestValidator } from "@nestia/e2e";

export const test_swagger = async () => {
    const content = await import("../../../swagger.json");
    const queries = content.paths["/query/typed"].get.parameters.filter(
        (p) => p.in === "query",
    );

    TestValidator.equals("queries")(queries.map((q) => q.name))([
        "limit",
        "enforce",
        "values",
        "atomic",
    ]);
    TestValidator.equals("not required")(
        queries.find((q) => q.name === "limit")?.required,
    )(false);
    TestValidator.equals("required")(
        queries.find((q) => q.name === "enforce")?.required &&
            !queries.find((q) => q.name === "enforce")?.schema.nullable,
    )(true);
    TestValidator.equals("nullable")(
        queries.find((q) => q.name === "atomic")?.schema.nullable,
    )(true);
};
