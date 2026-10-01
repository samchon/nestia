import { HttpError } from "@nestia/fetcher";
import { HttpException } from "@nestjs/common";

import { Creator } from "../typings/Creator";

/**
 * Exception manager for HTTP server.
 *
 * `ExceptionManager` is an utility class who can insert or erase custom error
 * class with its conversion method to a regular {@link nest.HttpException}
 * instance.
 *
 * If you define an API function through {@link TypedRoute} or
 * {@link EncryptedRoute} instead of the basic router decorator functions like
 * {@link nest.Get} or {@link nest.Post} and the API function throws a custom
 * error whose class has been {@link ExceptionManager.insert inserted} in this
 * `ExceptionManager`, the error would be automatically converted to the regular
 * {@link nest.HttpException} instance by the {@link ExceptionManager.Closure}
 * function.
 *
 * Therefore, with this `ExceptionManager` and {@link TypedRoute} or
 * {@link EncryptedRoute}, you can manage your custom error classes much
 * systematically. You can avoid 500 internal server error or hard coding
 * implementation about the custom error classes.
 *
 * Below error class is configured in this `ExceptionManager` by default.
 *
 * - `@nestia/fetcher.HttpError`
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @evidence contracts/common.md#principled-implementation Converters are kept as an ordered list of class and closure, and an error is converted by the first class it is an instance of; the insertion keeps every subclass before its superclasses so the most specific converter wins, and `HttpError` from the fetcher is registered by default.
 * @evidence contracts/common.md#clear-and-simple-design One namespace with the two collections and four operations; the listener set and the tuple list are the only state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The registration is public and explicit; no error class is special-cased except the default `HttpError` conversion.
 * @evidence contracts/common.md#meaningful-documentation The comment documents the converter and listener concepts with an example.
 */
export namespace ExceptionManager {
  /**
   * Insert an error class with converter.
   *
   * If you've inserted an duplicated error class, the closure would be
   * overwritten.
   *
   * @param creator Target error class
   * @param closure A closure function converting to the `HttpException` class
   * @evidence contracts/common.md#principled-implementation An existing entry for the same class is removed first, then the new entry is placed before the first registered class that it extends, so specificity order holds however the calls are ordered.
   * @evidence contracts/common.md#clear-and-simple-design One function over one list.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The order rule is derived from the prototype chain, not from a list of known classes.
   * @evidence contracts/common.md#meaningful-documentation The comment states the replacement and ordering rules.
   */
  export function insert<T extends Error>(
    creator: Creator<T>,
    closure: Closure<T>,
  ): void {
    const index: number = tuples.findIndex((tuple) => tuple[0] === creator);
    if (index !== -1) tuples.splice(index, 1);

    // an error converts by the first class it is an instance of, so a class
    // must precede every superclass of it: insert before the first one
    const ancestor: number = tuples.findIndex(
      ([registered]) => creator.prototype instanceof registered,
    );
    if (ancestor === -1) tuples.push([creator, closure]);
    else tuples.splice(ancestor, 0, [creator, closure]);
  }

  /**
   * Erase an error class.
   *
   * @param creator Target error class
   * @returns Whether be erased or not
   * @evidence contracts/common.md#principled-implementation The entry for the class is found by identity and removed, and the result says whether anything was removed.
   * @evidence contracts/common.md#clear-and-simple-design One search and one removal.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It removes only the named class's entry.
   * @evidence contracts/common.md#meaningful-documentation The comment states the parameter and the boolean result.
   */
  export function erase<T extends Error>(creator: Creator<T>): boolean {
    const index: number = tuples.findIndex((tuple) => tuple[0] === creator);
    if (index === -1) return false;

    tuples.splice(index, 1);
    return true;
  }

  /**
   * Registers a listener called with every error thrown by a typed route, after
   * the response conversion.
   *
   * @evidence contracts/common.md#principled-implementation The listener is added to a set, so the same function registered twice is called once.
   * @evidence contracts/common.md#clear-and-simple-design One set insertion.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The listener only observes; the route notifies it after the current turn and ignores its errors.
   * @evidence contracts/common.md#meaningful-documentation The comment states when listeners are called.
   */
  export function on(closure: (error: any) => any): void {
    listeners.add(closure);
  }

  /**
   * Unregisters a listener added with {@link on}.
   *
   * @evidence contracts/common.md#principled-implementation The listener is removed from the set by identity.
   * @evidence contracts/common.md#clear-and-simple-design One set deletion.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It removes only the named listener.
   * @evidence contracts/common.md#meaningful-documentation The comment names the counterpart operation.
   */
  export function off(closure: (error: any) => any): void {
    listeners.delete(closure);
  }

  /**
   * Type of a closure function converting to the regular
   * {@link nest.HttpException}.
   *
   * `ExceptionManager.Closure` is a type of closure function who are converting
   * from custom error to the regular {@link nest.HttpException} instance. It
   * would be used in the {@link ExceptionManager} with {@link TypedRoute} or
   * {@link EncryptedRoute}.
   *
   * @evidence contracts/common.md#principled-implementation A converter is a function from the caught error to an `HttpException`, whose status and body become the response.
   * @evidence contracts/common.md#clear-and-simple-design One call signature.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment documents the parameter and the return value.
   */
  export interface Closure<T extends Error> {
    /**
     * Error converter.
     *
     * Convert from custom error to the regular {@link nest.HttpException}
     * instance.
     *
     * @param exception Custom error instance
     * @returns Regular {@link nest.HttpException} instance
     */
    (exception: T): HttpException;
  }

  /** @internal */
  export const tuples: Array<[Creator<any>, Closure<any>]> = [];

  /** @internal */
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
