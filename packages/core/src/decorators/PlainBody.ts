import {
    BadRequestException,
    ExecutionContext,
    createParamDecorator,
} from "@nestjs/common";
import type express from "express";
import type { FastifyRequest } from "fastify";

import { get_text_body } from "./internal/get_text_body";

/**
 * Plain body decorator.
 *
 * `PlainBody` is a decorator function getting full body text from the HTTP request.
 *
 * If you adjust the regular {@link Body} decorator function to the body parameter,
 * you can't get the full body text because the {@link Body} tries to convert the
 * body text to JSON object. Therefore, `@nestia/core` provides this `PlainBody`
 * decorator function to get the full body text.
 *
 * ```typescript
 * \@TypedRoute.Post("memo")
 * public store
 *     (
 *         \@PlainBody() body: string
 *     ): void;
 * ```
 *
 * @return Parameter decorator
 * @author Jeongho Nam - https://github.com/samchon
 */
export const PlainBody: () => ParameterDecorator = createParamDecorator(
    async function PlainBody(_data: any, context: ExecutionContext) {
        const request: express.Request | FastifyRequest = context
            .switchToHttp()
            .getRequest();
        if (!isTextPlain(request.headers["content-type"]))
            throw new BadRequestException(
                `Request body type is not "text/plain".`,
            );
        return get_text_body(request);
    },
);

const isTextPlain = (text?: string): boolean =>
    text !== undefined &&
    text
        .split(";")
        .map((str) => str.trim())
        .some((str) => str === "text/plain");
