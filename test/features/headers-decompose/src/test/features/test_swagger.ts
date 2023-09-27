import { TestValidator } from "@nestia/e2e";

export const test_swagger = async () => {
    const content = await import("../../../swagger.json");
    const headers = content.paths["/headers/{section}"].patch.parameters.filter(
        (p) => p.in === "header",
    );
    TestValidator.equals("headers")(headers.map((p) => p.name))([
        "x-category",
        "x-memo",
        "x-name",
        "x-values",
        "x-flags",
    ]);
    const def = headers.find((p) => p.name === "x-name");
    TestValidator.equals("headers.x-name")(def?.schema.default)("Samchon");
};
