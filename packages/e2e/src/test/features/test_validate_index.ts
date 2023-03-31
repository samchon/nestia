import { TestValidator } from "../../TestValidator";
import { generate_random_articles } from "./internal/generate_random_articles";

export async function test_validate_index(): Promise<void> {
    const { data } = generate_random_articles();

    TestValidator.index("index")(data)(data);
    TestValidator.error("error")(() =>
        TestValidator.index("index")(data)(
            [
                {
                    ...data[0],
                    id: data[0].id + "sdafasdf",
                },
                ...data.slice(1),
            ],
            false,
        ),
    );
}
