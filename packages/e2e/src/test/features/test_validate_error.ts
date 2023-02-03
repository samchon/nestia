import { TestValidator } from "../../TestValidator";

export async function test_validate_error(): Promise<void> {
    await TestValidator.error("error")(async () => {
        throw new Error("Bug on TestValidator.error(): failed to catch error.");
    });
    await TestValidator.error("error")(() =>
        TestValidator.error("no-error")(async () => {}),
    );
}
