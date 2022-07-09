import * as express from "express";
import * as nest from "@nestjs/common";
import helper from "nestia-helper";

import { ICategory } from "../../api/structures/ICategory";

@nest.Controller("consumers/systematic/categories")
export class ConsumerCategoriesController {
    @nest.Get()
    public async top(
        @nest.Request() request: express.Request,
    ): Promise<ICategory[]> {
        request;

        return [];
    }

    @nest.Get(":id")
    public async at(
        @nest.Request() request: express.Request,
        @helper.TypedParam("id", "string") id: string,
    ): Promise<ICategory> {
        request;
        id;

        return null!;
    }

    @nest.Get(":id/invert")
    public async invert(
        @nest.Request() request: express.Request,
        @helper.TypedParam("id", "string") id: string,
    ): Promise<ICategory.IInvert> {
        request;
        id;

        return null!;
    }
}
