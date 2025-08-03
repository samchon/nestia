import type express from "express";
import type { FastifyRequest } from "fastify";

/** @internal */
export const is_request_body_undefined = (
  request: express.Request | FastifyRequest,
): boolean =>
  request.headers["content-type"] === undefined &&
  (request.body === undefined ||
    (typeof request.body === "object" &&
      request.body !== null &&
      Object.keys(request.body).length === 0));
