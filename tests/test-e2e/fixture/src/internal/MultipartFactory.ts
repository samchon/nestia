import { TypedFormData } from "@nestia/core";
import FastifyMulter from "fastify-multer";
import Multer from "multer";

/**
 * Composes the public multipart middleware for both actual HTTP adapters.
 *
 * A decorator retains its factory result across the sequential application
 * lifetimes. Dispatch must therefore use each real request's adapter shape,
 * rather than retaining the first application's Express middleware.
 *
 * @evidence contracts/common.md#principled-implementation The returned structural multer factory supplies the five public middleware methods. Each method builds the actual multer and fastify-multer middleware for the same field arguments and invokes the appropriate public middleware on each actual Express or Fastify request.
 * @evidence contracts/common.md#clear-and-simple-design One request-local raw-property distinction chooses the supported implementation; the public method names and caller's optional disk destination remain unchanged. No application or controller path determines dispatch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This authored composition does not replace any foreign method, parser, cache or validator. Both implementations receive the actual request, response and callback and retain their native error and file behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies why a cached decorator factory must support both sequential backend lifetimes and why dispatch belongs to the actual request.
 * @evidence contracts/performance.md#efficient-algorithms Each registered middleware prepares two supported implementations once; request dispatch performs one shape check and delegates without buffering or copying bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Immutable field arguments and disk destination are shared by the two adapter implementations, while each request retains its own parsed fields and uploads. The same decorator singleton can therefore serve both application lifetimes without retaining an adapter-specific choice.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only middleware functions remain with the compiled controller module. The real multer implementations own request upload state, and TypedFormData consumes and removes disk files before passing decoded File values to the handler.
 * @evidence contracts/portability.md#os-neutral-implementation The optional disk destination comes from the caller's platform-selected temporary directory; middleware dispatch is based on HTTP request structure and uses no filesystem or platform-name predicates.
 */
export const createMultipartUpload = (
  options: { dest?: string } = {},
): TypedFormData.IMulterBase => {
  const express = Multer(options);
  const fastify = FastifyMulter(options);
  const middleware = (method: keyof TypedFormData.IMulterBase, args: any[]) => {
    const expressHandler = (
      express[method] as (...parameters: any[]) => any
    ).apply(express, args);
    const fastifyHandler = (
      fastify[method] as (...parameters: any[]) => any
    ).apply(fastify, args);
    return (
      request: { raw?: unknown },
      response: unknown,
      next: (error?: unknown) => void,
    ) =>
      (request.raw === undefined ? expressHandler : fastifyHandler)(
        request,
        response,
        next,
      );
  };
  return {
    single: (...args: any[]) => middleware("single", args),
    array: (...args: any[]) => middleware("array", args),
    fields: (...args: any[]) => middleware("fields", args),
    any: (...args: any[]) => middleware("any", args),
    none: (...args: any[]) => middleware("none", args),
  };
};
