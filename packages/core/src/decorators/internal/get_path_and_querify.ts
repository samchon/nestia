import { InternalServerErrorException } from "@nestjs/common";
import typia, { IValidation, TypeGuardError } from "typia";

import { IResponseBodyQuerifier } from "../../options/IResponseBodyQuerifier";
import { NoTransformConfigurationError } from "../NoTransformConfigurationError";
import type { TypedRoute } from "../TypedRoute";

/** @internal */
export const get_path_and_querify =
  (logger: () => (log: TypedRoute.IValidateErrorLog) => void) =>
  (method: string) =>
  (
    ...args: any[]
  ): [
    string | string[] | undefined,
    (input: any, method: string, path: string) => URLSearchParams,
  ] => {
    const path: string | string[] | null | undefined =
      args[0] === undefined ||
      typeof args[0] === "string" ||
      Array.isArray(args[0])
        ? args[0]
        : null;
    const functor: IResponseBodyQuerifier<any> | undefined =
      path === null ? args[0] : args[1];
    return [path ?? undefined, take(logger)(method)(functor)];
  };

/** @internal */
const take =
  (logger: () => (log: TypedRoute.IValidateErrorLog) => void) =>
  (method: string) =>
  <T>(functor?: IResponseBodyQuerifier<T> | null) => {
    if (functor === undefined) {
      NoTransformConfigurationError(method);
      return querify;
    } else if (functor === null) return querify;
    else if (functor.type === "stringify") return functor.stringify;
    else if (functor.type === "assert") return assert(functor.assert);
    else if (functor.type === "is") return is(functor.is);
    else if (functor.type === "validate") return validate(functor.validate);
    else if (functor.type === "validate.log")
      return validateLog(logger)(functor.validate);
    throw new Error(
      `Error on nestia.core.${method}(): invalid typed stringify function.`,
    );
  };

/** @internal */
const querify = (input: Record<string, any>): URLSearchParams => {
  const output: URLSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(input))
    if (value === undefined) continue;
    else if (Array.isArray(value))
      for (const elem of value) output.append(key, String(elem));
    else output.append(key, String(value));
  return output;
};

/** @internal */
const assert =
  <T>(closure: (data: T) => URLSearchParams) =>
  (data: T) => {
    try {
      return closure(data);
    } catch (exp) {
      if (typia.is<TypeGuardError>(exp))
        throw new InternalServerErrorException({
          path: exp.path,
          reason: exp.message,
          expected: exp.expected,
          value: exp.value,
          message: MESSAGE,
        });
      throw exp;
    }
  };

/** @internal */
const is =
  <T>(closure: (data: T) => URLSearchParams | null) =>
  (data: T) => {
    const result: URLSearchParams | null = closure(data);
    if (result === null) throw new InternalServerErrorException(MESSAGE);
    return result;
  };

/** @internal */
const validate =
  <T>(closure: (data: T) => IValidation<URLSearchParams>) =>
  (data: T) => {
    const result: IValidation<URLSearchParams> = closure(data);
    if (result.success === false)
      throw new InternalServerErrorException({
        errors: result.errors,
        message: MESSAGE,
      });
    return result.data;
  };

/** @internal */
/**
 * `validate.log`: an invalid response is reported to the validate-error logger
 * and sent as it is, as `@TypedRoute`'s JSON responses are.
 */
const validateLog =
  (logger: () => (log: TypedRoute.IValidateErrorLog) => void) =>
  <T>(closure: (data: T) => IValidation<URLSearchParams>) =>
  (data: T, method: string, path: string): URLSearchParams => {
    const result: IValidation<URLSearchParams> = closure(data);
    if (result.success === true) return result.data;
    logger()({
      errors: result.errors,
      method,
      path,
      data,
    });
    return querify(data as Record<string, any>);
  };

const MESSAGE = "Response body data is not following the promised type.";
