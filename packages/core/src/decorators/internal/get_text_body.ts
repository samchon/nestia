import type express from "express";
import type { FastifyRequest } from "fastify";
import raw from "raw-body";

/** @internal */
export const get_text_body = async (
  request: express.Request | FastifyRequest,
): Promise<string> => {
  if (isExpressRequest(request) === false) return request.body as string;
  // a body parser the application registered, such as
  // `app.useBodyParser("text")`, has already consumed the stream
  if (typeof request.body === "string") return request.body;
  if (Buffer.isBuffer(request.body)) return request.body.toString("utf8");
  return (await raw(request)).toString("utf8");
};

/** @internal */
const isExpressRequest = (
  request: express.Request | FastifyRequest,
): request is express.Request => (request as express.Request).app !== undefined;
