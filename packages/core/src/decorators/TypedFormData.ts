import {
  BadRequestException,
  ExecutionContext,
  createParamDecorator,
} from "@nestjs/common";
import type { HttpArgumentsHost } from "@nestjs/common/interfaces";
import type express from "express";
import fs from "fs";
import type ExpressMulter from "multer";

import type { IRequestFormDataProps } from "../options/IRequestFormDataProps";
import { Singleton } from "../utils/Singleton";
import { is_media_type } from "./internal/is_media_type";
import { validate_request_form_data } from "./internal/validate_request_form_data";

/**
 * Type safe multipart/form-data decorator.
 *
 * `TypedFormData.Body()` is a request body decorator function for the
 * `multipart/form-data` content type. It automatically casts property type
 * following its DTO definition, and performs the type validation too.
 *
 * Also, `TypedFormData.Body()` is much easier and type safer than
 * `@nest.UploadFile()`. If you're considering the [SDK
 * library](https://nestia.io/docs/sdk/sdk) generation, only
 * `TypedFormData.Body()` can do it. Therefore, I recommend you to use
 * `TypedFormData.Body()` instead of the `@nest.UploadFile()` function.
 *
 * For reference, target type `T` must follow such restriction. Of course, if
 * actual form-data values are different with their promised type `T`,
 * `BadRequestException` error (status code: 400) would be thrown.
 *
 * 1. Type `T` must be an object type
 * 2. Do not allow dynamic property
 * 3. Only `boolean`, `bigint`, `number`, `string`, `Blob`, `File` or their array
 *    types are allowed
 * 4. By the way, union type never be not allowed
 *
 * By the way, if you're using `fastify`, pass a `fastify-multer` instance as
 * the factory, and register a `multipart/form-data` content type parser that
 * leaves the request stream to it when composing the NestJS application.
 * Without the parser, Fastify rejects every multipart request with 415.
 * `fastify-multer`'s own `contentParser` plugin declares the content type
 * `multipart` without a subtype, which Fastify 5 (NestJS 11) refuses to
 * register.
 *
 * ```typescript
 * import { NestFactory } from "@nestjs/core";
 * import {
 *   FastifyAdapter,
 *   NestFastifyApplication,
 * } from "@nestjs/platform-fastify";
 *
 * export async function main() {
 *   const app = await NestFactory.create<NestFastifyApplication>(
 *     AppModule,
 *     new FastifyAdapter(),
 *   );
 *   app
 *     .getHttpAdapter()
 *     .getInstance()
 *     .addContentTypeParser("multipart/form-data", (_req, _payload, done) =>
 *       done(null),
 *     );
 *   await app.listen(3000);
 * }
 *
 * // in the controller, with `import FastifyMulter from "fastify-multer"`
 * public async upload(
 *   @TypedFormData.Body(() => FastifyMulter()) body: IMultipart,
 * ): Promise<void> {}
 * ```
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @todo Change to ReadableStream through configuring storage engine of multer
 */
export namespace TypedFormData {
  /**
   * Request body decorator.
   *
   * Request body decorator for the `multipart/form-data` type.
   *
   * Much easier and type safer than `@nest.UploadFile()` decorator.
   *
   * @param factory Factory function creating the `multer` or `fastify-multer`
   *   instance. In the factory function, you also can specify the multer
   *   composition options like `storage` engine: memory and disk storage
   *   deliver the uploaded bytes, and an engine keeping neither the buffer nor
   *   a file path is rejected.
   */
  export function Body<Multer extends IMulterBase>(
    factory: () => Multer | Promise<Multer>,
  ): ParameterDecorator;

  /** @internal */
  export function Body<T extends object>(
    factory: () => Promise<IMulterBase>,
    props?: IRequestFormDataProps<T> | undefined,
  ): ParameterDecorator {
    if (typeof File === "undefined")
      throw new Error(
        "Error on TypedFormData.Body(): 'File' class is not supported in the older version of NodeJS. Upgrade the NodeJS to the modern.",
      );
    const checker = validate_request_form_data(props);
    const uploader = new Singleton(async () =>
      decode((await factory()) as ExpressMulter.Multer, props),
    );
    return createParamDecorator(async function TypedFormDataBody(
      _unknown: any,
      context: ExecutionContext,
    ): Promise<T> {
      const http: HttpArgumentsHost = context.switchToHttp();
      const request: express.Request = http.getRequest();
      if (
        is_media_type(
          request.headers["content-type"],
          "multipart/form-data",
        ) === false
      )
        throw new BadRequestException(
          `Request body type is not "multipart/form-data".`,
        );
      const data: FormData = await (
        await uploader.get()
      )({
        request: request as any,
        response: http.getResponse(),
      });
      const output: T | Error = checker(data);
      if (output instanceof Error) throw output;
      return output;
    })();
  }

  /** Base type of the `multer` or `fastify-multer`. */
  export interface IMulterBase {
    single(fieldName: string): any;
    array(fieldName: string, maxCount?: number): any;
    fields(fields: readonly object[]): any;
    any(): any;
    none(): any;
  }
}

/** @internal */
const decode = <T>(
  multer: ExpressMulter.Multer,
  props: IRequestFormDataProps<T> | undefined,
) => {
  // without the transform nothing names the file fields, so accept every file
  const upload =
    props === undefined
      ? multer.any()
      : multer.fields(
          props.files.map((file) => ({
            name: file.name,
            ...(file.limit === 1 ? { maxCount: 1 } : {}),
          })),
        );
  const interceptor = (request: express.Request, response: express.Response) =>
    new Promise<void>((resolve, reject) =>
      upload(request, response, (error) => {
        if (error) reject(error);
        else resolve();
      }),
    );
  return async (socket: {
    request: express.Request;
    response: express.Response;
  }): Promise<FormData> => {
    await interceptor(socket.request, socket.response);

    const data: FormData = new FormData();
    for (const [key, value] of Object.entries(socket.request.body))
      if (Array.isArray(value))
        for (const elem of value) data.append(key, String(elem));
      else data.append(key, String(value));
    if (socket.request.files) await parseFiles(data)(socket.request.files);
    return data;
  };
};

/** @internal */
const parseFiles =
  (data: FormData) =>
  async (
    files: Express.Multer.File[] | Record<string, Express.Multer.File[]>,
  ): Promise<void> => {
    const entries: Array<[string, Express.Multer.File]> = Array.isArray(files)
      ? files.map((file) => [file.fieldname, file])
      : Object.entries(files).flatMap(([key, value]) =>
          value.map((file): [string, Express.Multer.File] => [key, file]),
        );
    for (const [key, file] of entries) data.append(key, await toFile(file));
  };

/**
 * The uploaded file as a `File`: memory storage keeps its bytes in `buffer`,
 * disk storage in the file at `path`. An engine keeping neither cannot deliver
 * it, which must not pass as an empty or placeholder file.
 *
 * @internal
 */
const toFile = async (file: Express.Multer.File): Promise<File> => {
  const bytes: Buffer | undefined =
    file.buffer !== undefined
      ? file.buffer
      : typeof file.path === "string"
        ? await fs.promises.readFile(file.path)
        : undefined;
  if (bytes === undefined)
    throw new Error(
      `Error on TypedFormData.Body(): the multer storage engine kept neither the buffer nor the path of the uploaded file ${JSON.stringify(file.fieldname)}, so it cannot be read as a File. Use memory or disk storage.`,
    );
  return new File([bytes as any], file.originalname, { type: file.mimetype });
};
