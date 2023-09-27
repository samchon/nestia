import { TestValidator } from "@nestia/e2e";

export const test_swagger = async () => {
    const content = await import("../../../swagger.json");
    const route = content.paths["/users/{user_id}/user"].get;

    TestValidator.equals("202")(
        route.responses["202"].content["application/json"].schema.$ref,
    )("#/components/schemas/IUser");
    TestValidator.equals("404")(
        route.responses["404"].content["application/json"].schema.enum[0],
    )("404 Not Found");
};
