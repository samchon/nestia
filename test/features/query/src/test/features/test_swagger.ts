import { TestValidator } from "@nestia/e2e";

export const test_swagger = async (): Promise<void> => {
    const swagger = await import("../../../swagger.json");
    TestValidator.equals("replace")(true)(
        !!swagger.components.schemas?.OmitIQueryatomic,
    );
};
