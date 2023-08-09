import { HttpError } from "@nestia/fetcher";
import { HttpException } from "@nestjs/common";

import { Creator } from "../typings/Creator";

/**
 * Exception manager for HTTP server.
 *
 * `ExceptionManager` is an utility class who can insert or erase custom error class with
 * its convertion method to a regular {@link nest.HttpException} instance.
 *
 * If you define an API function through {@link TypedRoute} or {@link EncryptedRoute}
 * instead of the basic router decorator functions like {@link nest.Get} or
 * {@link nest.Post} and the API function throws a custom error whose class has been
 * {@link ExceptionManager.insert inserted} in this `EntityManager`, the error would be
 * automatically converted to the regular {@link nest.HttpException} instance by the
 * {@link ExceptionManager.Closure} function.
 *
 * Therefore, with this `ExceptionManager` and {@link TypedRoute} or {@link EncryptedRoute},
 * you can manage your custom error classes much systemtically. You can avoid 500 internal
 * server error or hard coding implementation about the custom error classes.
 *
 * Below error classes are defaultly configured in this `ExceptionManager`
 *
 *   - `typia.TypeGuardError`
 *   - `@nestia/fetcher.HttpError`
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace ExceptionManager {
    /**
     * Insert an error class with converter.
     *
     * If you've inserted an duplicated error class, the closure would be overwritten.
     *
     * @param creator Target error class
     * @param closure A closure function converting to the `HttpException` class
     */
    export function insert<T extends Error>(
        creator: Creator<T>,
        closure: Closure<T>,
    ): void {
        const index: number = tuples.findIndex((tuple) => tuple[0] === creator);
        if (index !== -1) tuples.splice(index, 1);

        tuples.push([creator, closure]);
        tuples.sort(([x], [y]) => (x.prototype instanceof y ? -1 : 1));
    }

    /**
     * Erase an error class.
     *
     * @param creator Target error class
     * @returns Whether be erased or not
     */
    export function erase<T extends Error>(creator: Creator<T>): boolean {
        const index: number = tuples.findIndex((tuple) => tuple[0] === creator);
        if (index === -1) return false;

        tuples.splice(index, 1);
        return true;
    }

    export function on(closure: (error: any) => any): void {
        listeners.add(closure);
    }

    export function off(closure: (error: any) => any): void {
        listeners.delete(closure);
    }

    /**
     * Type of a closure function converting to the regular {@link nest.HttpException}.
     *
     * `ExceptionManager.Closure` is a type of closure function who are converting from
     * custom error to the regular {@link nest.HttpException} instance. It would be used
     * in the {@link ExceptionManager} with {@link TypedRoute} or {@link EncryptedRoute}.
     */
    export interface Closure<T extends Error> {
        /**
         * Error converter.
         *
         * Convert from custom error to the regular {@link nest.HttpException} instance.
         *
         * @param exception Custom error instance
         * @return Regular {@link nest.HttpException} instance
         */
        (exception: T): HttpException;
    }

    /**
     * @internal
     */
    export const tuples: Array<[Creator<any>, Closure<any>]> = [];

    /**
     * @internal
     */
    export const listeners: Set<(error: any) => any> = new Set();
}

ExceptionManager.insert(
    HttpError,
    (error) =>
        new HttpException(
            {
                path: error.path,
                message: error.message,
            },
            error.status,
        ),
);
