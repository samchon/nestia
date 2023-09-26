import { HttpException } from "@nestjs/common";
import express from "express";
import type { FastifyRequest } from "fastify";
import { throwError } from "rxjs";

import { ExceptionManager } from "../../utils/ExceptionManager";

/**
 * @internal
 */
export function route_error(
    request: express.Request | FastifyRequest,
    error: any,
) {
    error = (() => {
        // HTTP-ERROR
        if (error instanceof HttpException) return error;

        // CUSTOM-REGISTERED ERROR
        for (const [creator, closure] of ExceptionManager.tuples)
            if (error instanceof creator) return closure(error);

        // MAYBE INTERNAL ERROR
        return error;
    })();

    try {
        error.method = request.method;
        error.path =
            (request as express.Request).path ??
            (request as FastifyRequest).routeOptions?.url ??
            (request as FastifyRequest).routerPath;
    } catch {}

    setTimeout(() => {
        for (const listener of ExceptionManager.listeners) {
            try {
                const res: any | Promise<any> = listener(error);
                if (typeof res === "object" && typeof res.catch === "function")
                    res.catch(() => {});
            } catch {}
        }
    }, 0);
    return throwError(() => error);
}
