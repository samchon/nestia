import { TestValidator } from "@nestia/e2e";

export const test_swagger = async () => {
    const content = await import("../../../swagger.json");
    const route = content.paths["/status/random"].get;

    TestValidator.equals("300")(
        route.responses["300"].content["application/json"].schema.$ref,
    )("#/components/schemas/IBbsArticle");
};
