import { Controller } from "@nestjs/common";
import typia, { TypeGuardError } from "typia";

import {
    TypedBody,
    TypedException,
    TypedParam,
    TypedRoute,
} from "@nestia/core";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";
import { IInternalServerError } from "@api/lib/structures/IInternalServerError";
import { INotFound } from "@api/lib/structures/INotFound";
import { IUnprocessibleEntity } from "@api/lib/structures/IUnprocessibleEntity";

@Controller("exception")
export class ExceptionController {
    @TypedRoute.Post(":section/typed")
    @TypedException<TypeGuardError>(400, "invalid request")
    @TypedException<INotFound>(404, "unable to find the matched section")
    @TypedException<IUnprocessibleEntity>(428)
    @TypedException<IInternalServerError>("5XX", "internal server error")
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
     * @throw 5XX internal server error
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
     * @throw 5XX internal server error
     */
    @TypedRoute.Post(":section/composite")
    @TypedException<TypeGuardError>(400, "invalid request")
    @TypedException<INotFound>(404)
    @TypedException<IUnprocessibleEntity>(428)
    @TypedException<IInternalServerError>("5XX")
    public async composite(
        @TypedParam("section") section: string,
        @TypedBody() input: IBbsArticle.IStore,
    ): Promise<IBbsArticle> {
        section;
        input;
        return typia.random<IBbsArticle>();
    }
}
