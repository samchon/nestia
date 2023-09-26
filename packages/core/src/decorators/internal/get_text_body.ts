import type express from "express";
import type { FastifyRequest } from "fastify";
import raw from "raw-body";

/**
 * @internal
 */
export const get_text_body = async (
    request: express.Request | FastifyRequest,
): Promise<string> =>
    isExpressRequest(request)
        ? (await raw(request)).toString("utf8")
        : (request.body as string);

/**
 * @internal
 */
const isExpressRequest = (
    request: express.Request | FastifyRequest,
): request is express.Request => (request as express.Request).app !== undefined;
