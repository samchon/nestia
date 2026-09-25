import { HttpException } from "@nestjs/common";
import type express from "express";
import type { FastifyRequest } from "fastify";
import raw from "raw-body";

/** @internal */
export const get_text_body = async (
  request: express.Request | FastifyRequest,
): Promise<string> => {
  if (isExpressRequest(request) === false) return request.body as string;
  // a body parser the application registered, such as
  // `app.useBodyParser("text", { limit })`, has already consumed the stream
  if (typeof request.body === "string") return request.body;
  if (Buffer.isBuffer(request.body)) return request.body.toString("utf8");
  try {
    return (await raw(request, { limit: TEXT_BODY_LIMIT })).toString("utf8");
  } catch (error) {
    throw toHttpException(error);
  }
};

/**
 * The size limit of a text body no parser consumed: `body-parser`'s default,
 * the one NestJS's Express adapter gives the JSON and URL-encoded bodies it
 * parses, so that a text body is no exception to it.
 *
 * @internal
 */
const TEXT_BODY_LIMIT = "100kb";

/**
 * A body that could not be read answers the status `raw-body` reports for it:
 * 413 over the limit, 400 for an aborted or truncated request. A server-side
 * failure stays as it is.
 *
 * @internal
 */
const toHttpException = (error: unknown): unknown => {
  const status: unknown = (error as { status?: unknown } | null)?.status;
  return error instanceof Error &&
    typeof status === "number" &&
    status >= 400 &&
    status < 500
    ? new HttpException(error.message, status, { cause: error })
    : error;
};

/** @internal */
const isExpressRequest = (
  request: express.Request | FastifyRequest,
): request is express.Request => (request as express.Request).app !== undefined;
