import { Controller } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
import typia, { TypeGuardError } from "typia";

import {
    TypedBody,
    TypedException,
    TypedParam,
    TypedRoute,
} from "@nestia/core";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";
import { INotFound } from "@api/lib/structures/INotFound";
import { IUnprocessibleEntity } from "@api/lib/structures/IUnprocessibleEntity";

@Controller("exception")
export class ExceptionController {
    @TypedException<TypeGuardError>(400, "invalid request")
    @TypedException<INotFound>(404, "unable to find the matched section")
    @TypedException<IUnprocessibleEntity>(428)
    @TypedRoute.Post(":section/typed")
    public async typed(
        @TypedParam("section") section: string,
        @TypedBody() input: IBbsArticle.IStore,
    ): Promise<IBbsArticle> {
        section;
        input;
        return typia.random<IBbsArticle>();
    }

    /**
     * @throws 400 invalid request
     * @throws 404 unable to find the matched section
     * @throw 428 unable to process the request
     */
    @TypedRoute.Post(":section/tags")
    public async tags(
        @TypedParam("section") section: string,
        @TypedBody() input: IBbsArticle.IStore,
    ): Promise<IBbsArticle> {
        section;
        input;
        return typia.random<IBbsArticle>();
    }

    /**
     * @throws 400 invalid request
     * @throws 404 unable to find the matched section
     * @throw 428 unable to process the request
     * @throw 500 internal server error
     */
    @TypedException<TypeGuardError>(400, "invalid request")
    @TypedException<INotFound>(404)
    @TypedException<IUnprocessibleEntity>(428)
    @TypedRoute.Post(":section/composite")
    public async composite(
        @TypedParam("section") section: string,
        @TypedBody() input: IBbsArticle.IStore,
    ): Promise<IBbsArticle> {
        section;
        input;
        return typia.random<IBbsArticle>();
    }
}
