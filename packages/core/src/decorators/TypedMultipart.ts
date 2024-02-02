import {
  BadRequestException,
  ExecutionContext,
  createParamDecorator,
} from "@nestjs/common";
import { HttpArgumentsHost } from "@nestjs/common/interfaces";
import express from "express";
import multer from "multer";
import typia from "typia";

import { IRequestMultipartProps } from "../options/IRequestMulltipartProps";
import { Singleton } from "../utils/Singleton";
import { validate_request_multipart } from "./internal/validate_request_multipart";

/**
 * Type safe multipart/form-data decorator.
 *
 * `TypedMultipart.Body()` is a request body decorator function for the
 * `multipart/form-data` content type. It automatically casts property type
 * following its DTO definition, and performs the type validation too.
 *
 * Also, `TypedMultipart.Body()` is much easier and type safer than `@nest.UploadFile()`.
 * If you're considering the [SDK library](https://nestia.io/docs/sdk/sdk) generation,
 * only `TypedMultipart.Body()` can do it. Therefore, I recommend you to use
 * `TypedMultipart.Body()` instead of the `@nest.UploadFile()` function.
 *
 * For reference, target type `T` must follow such restriction. Of course, if actual
 * form-data values are different with their promised type `T`,
 * `BadRequestException` error (status code: 400) would be thrown.
 *
 * 1. Type `T` must be an object type
 * 2. Do not allow dynamic property
 * 3. Only `boolean`, `bigint`, `number`, `string`, `Blob`, `File` or their array types are allowed
 * 4. By the way, union type never be not allowed
 * 5. Supports only Express, not Fastify
 *
 * @todo Change to ReadableStream through configuring storage engine of multer
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace TypedMultipart {
  /**
   * Request body decorator.
   *
   * Request body decorator for the `multipart/form-data` type.
   *
   * Much easier and type safer than `@nest.UploadFile()` decorator.
   *
   * @param props Automatically filled by transformer
   */
  export function Body<T extends object>(
    props?: IRequestMultipartProps<T>,
  ): ParameterDecorator {
    const checker = validate_request_multipart(props);
    const upload = app.get().fields(
      props!.files.map((file) => ({
        name: file.name,
        ...(file.limit === 1 ? { maxCount: 1 } : {}),
      })),
    );
    const interceptor = (
      request: express.Request,
      response: express.Response,
    ) =>
      new Promise<void>((resolve, reject) =>
        upload(request, response, (error) => {
          if (error) reject(error);
          else resolve();
        }),
      );
    return createParamDecorator(async function TypedMultipartBody(
      _unknown: any,
      context: ExecutionContext,
    ) {
      const http: HttpArgumentsHost = context.switchToHttp();
      const request: express.Request = http.getRequest();
      if (isMultipartFormData(request.headers["content-type"]) === false)
        throw new BadRequestException(
          `Request body type is not "application/x-www-form-urlencoded".`,
        );
      await interceptor(request, http.getResponse());

      const data: FormData = new FormData();
      for (const [key, value] of Object.entries(request.body))
        for (const elem of String(value).split(",")) data.append(key, elem);
      if (request.files) parseFiles(data)(request.files);

      const output: T | Error = checker(data);
      if (output instanceof Error) throw output;
      return output;
    })();
  }
  Object.assign(Body, typia.http.assertFormData);
  Object.assign(Body, typia.http.isFormData);
  Object.assign(Body, typia.http.validateFormData);

  export interface IProps<T> {
    files: Array<{
      name: string;
      limit: number | null;
    }>;
    validator: IRequestMultipartProps<T>;
  }
}

/**
 * @internal
 */
const parseFiles =
  (data: FormData) =>
  (files: Express.Multer.File[] | Record<string, Express.Multer.File[]>) => {
    if (Array.isArray(files))
      for (const file of files)
        data.append(
          file.fieldname,
          new File([file.buffer], file.originalname, {
            type: file.mimetype,
          }),
        );
    else
      for (const [key, value] of Object.entries(files))
        for (const file of value)
          data.append(
            key,
            new File([file.buffer], file.originalname, {
              type: file.mimetype,
            }),
          );
  };

/**
 * @internal
 */
function isMultipartFormData(text?: string): boolean {
  return (
    text !== undefined &&
    text
      .split(";")
      .map((str) => str.trim())
      .some((str) => str === "multipart/form-data")
  );
}

/**
 * @internal
 */
const app = new Singleton(() => multer());
