import { TestValidator } from "../../TestValidator";

export async function test_validate_error(): Promise<void> {
    // ASYNCHRONOUS
    await TestValidator.error("error")(async () => {
        throw new Error("Bug on TestValidator.error(): failed to catch error.");
    });
    await TestValidator.error("error")(() =>
        TestValidator.error("no-error")(async () => {}),
    );

    // SYNCHRONOUS
    await TestValidator.error("error")(() => {
        throw new Error("Bug on TestValidator.error(): failed to catch error.");
    });
    TestValidator.error("error")(() =>
        TestValidator.error("no-error")(() => {}),
    );
}
