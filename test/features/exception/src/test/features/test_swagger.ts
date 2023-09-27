import { TestValidator } from "@nestia/e2e";

export const test_swagger = async () => {
    const content = await import("../../../swagger.json");
    const res = content.paths["/exception/{section}/typed"].post.responses;

    const expected = [
        [201, "IBbsArticle"],
        [400, "TypeGuardError"],
        [404, "INotFound"],
        [428, "IUnprocessibleEntity"],
        ["5XX", "IInternalServerError"],
    ] as const;
    for (const [key, value] of expected)
        TestValidator.equals(key.toString())(
            res[key].content["application/json"].schema.$ref,
        )(`#/components/schemas/${value}`);
};
