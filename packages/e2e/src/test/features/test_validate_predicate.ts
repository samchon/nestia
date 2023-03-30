import { TestValidator } from "../../TestValidator";

export function test_validate_predicate(): void {
    TestValidator.predicate("true")(() => true);
    TestValidator.error("false")(() =>
        TestValidator.predicate("")(() => false),
    );
}
