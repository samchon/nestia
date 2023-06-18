import {
    BadRequestException,
    ExecutionContext,
    createParamDecorator,
} from "@nestjs/common";
import Ajv from "ajv";
import type express from "express";
import type { FastifyRequest } from "fastify";
import { IJsonApplication } from "typia";

import { getFastifyComponents } from "./getFastifyComponents";

export const FastifyBody = (doc: IJsonApplication) => {
    const validate = new Ajv({
        schemas: getFastifyComponents(doc),
        keywords: [
            "x-typia-tuple",
            "x-typia-metaTags",
            "x-typia-jsDocTags",
            "x-typia-required",
            "x-typia-optional",
            "x-typia-rest",
        ],
        strict: true,
        strictNumbers: false,
        code: {
            es5: true,
            lines: true,
            source: true,
        },
    }).compile(doc.schemas[0]);

    return createParamDecorator(function TypedBody(
        _unknown: any,
        context: ExecutionContext,
    ) {
        const request: express.Request | FastifyRequest = context
            .switchToHttp()
            .getRequest();
        if (isApplicationJson(request.headers["content-type"]) === false)
            throw new BadRequestException(
                `Request body type is not "application/json".`,
            );

        const success: boolean = validate(request.body);
        if (success === false)
            throw new BadRequestException(
                validate.errors?.[0].message ?? "unknown",
            );
        return request.body;
    })();
};

const isApplicationJson = (text?: string): boolean =>
    text !== undefined &&
    text
        .split(";")
        .map((str) => str.trim())
        .some((str) => str === "application/json");
