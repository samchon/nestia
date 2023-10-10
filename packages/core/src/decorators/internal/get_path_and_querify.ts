import { InternalServerErrorException } from "@nestjs/common";

import typia, { IValidation, TypeGuardError } from "typia";

import { IResponseBodyQuerifier } from "../../options/IResponseBodyQuerifier";
import { NoTransformConfigureError } from "./NoTransformConfigureError";

/**
 * @internal
 */
export const get_path_and_querify =
    (method: string) =>
    (
        ...args: any[]
    ): [string | string[] | undefined, (input: any) => URLSearchParams] => {
        const path: string | string[] | null | undefined =
            args[0] === undefined ||
            typeof args[0] === "string" ||
            Array.isArray(args[0])
                ? args[0]
                : null;
        const functor: IResponseBodyQuerifier<any> | undefined =
            path === null ? args[0] : args[1];
        return [path ?? undefined, take(method)(functor)];
    };

/**
 * @internal
 */
const take =
    (method: string) =>
    <T>(functor?: IResponseBodyQuerifier<T> | null) => {
        if (functor === undefined) throw NoTransformConfigureError(method);
        else if (functor === null) return querify;
        else if (functor.type === "stringify") return functor.stringify;
        else if (functor.type === "assert") return assert(functor.assert);
        else if (functor.type === "is") return is(functor.is);
        else if (functor.type === "validate") return validate(functor.validate);
        throw new Error(
            `Error on nestia.core.${method}(): invalid typed stringify function.`,
        );
    };

const querify = (input: Record<string, any>): URLSearchParams => {
    const output: URLSearchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(input))
        if (key === undefined) continue;
        else if (Array.isArray(value))
            for (const elem of value) output.append(key, String(elem));
        else output.append(key, String(value));
    return output;
};

/**
 * @internal
 */
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

/**
 * @internal
 */
const is =
    <T>(closure: (data: T) => URLSearchParams | null) =>
    (data: T) => {
        const result: URLSearchParams | null = closure(data);
        if (result === null) throw new InternalServerErrorException(MESSAGE);
        return result;
    };

/**
 * @internal
 */
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

/**
 * @internal
 */
const MESSAGE = "Response body data is not following the promised type.";
