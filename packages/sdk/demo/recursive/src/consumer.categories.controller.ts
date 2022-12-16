import helper from "@nestia/core";
import * as nest from "@nestjs/common";
import { randint } from "tstl/algorithm/random";

import { ICategory } from "./api/structures/ICategory";

@nest.Controller("consumers/systematic/categories")
export class ConsumerCategoriesController {
    @nest.Get()
    public async top(): Promise<ICategory[]> {
        return generate_random_categories();
    }

    @nest.Get(":id")
    public async at(
        @helper.TypedParam("id", "number") id: number,
    ): Promise<ICategory> {
        const category: ICategory = generate_random_categories(1)[0];
        category.id = id;
        return category;
    }

    @nest.Get(":id/invert")
    public async invert(
        @helper.TypedParam("id", "number") id: number,
    ): Promise<ICategory.IInvert> {
        return {
            id,
            code: "target",
            name: "target",
            parent: {
                id: 1,
                code: "parent",
                name: "parent",
                parent: {
                    id: 2,
                    code: "grandparent",
                    name: "grandparent",
                    parent: {
                        id: 3,
                        code: "root",
                        name: "root",
                        parent: null,
                    },
                },
            },
        };
    }
}

function generate_random_categories(level: number = 0): ICategory[] {
    if (level === 3) return [];
    return new Array(randint(2, 5)).fill("").map(() => ({
        id: randint(1, 100),
        code: "code",
        name: "name",
        children: generate_random_categories(level + 1),
    }));
}
