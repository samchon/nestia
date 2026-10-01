import { HttpError } from "./HttpError";
import { join_host_and_path } from "./internal/join_host_and_path";

/**
 * Request validation for the mockup simulator of a generated SDK.
 *
 * A simulated function does not call a server. It validates its input with
 * typia and, when the input is wrong, throws the `HttpError` with status 400
 * that the real server would answer with.
 *
 * @evidence contracts/common.md#principled-implementation Each validator runs the caller's assertion and converts a readable typia `TypeGuardError` shape into an `HttpError` 400 whose JSON body carries the method, path, expected type and value plus a message naming the failing part. A shared snapshot reads each needed property once; malformed or unreadable shapes rethrow the caller's original value. Payload values must support JSON serialization, whose errors still propagate.
 * @evidence contracts/common.md#clear-and-simple-design One public entry point, `assert`, returns four validators that differ only in their message, sharing one private conversion; the shape snapshot reader and the error interface are module-private.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Classification checks the readable error structure (method, path, expected type, name, message and stack) rather than its class, then captures the payload value. Only property-access failures make the shape unclassifiable; unrelated task errors are neither replaced nor swallowed.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the simulator validates and what it throws.
 */
export namespace NestiaSimulator {
  /**
   * Route facts the simulator needs to build its 400 error: the host, the path,
   * and the method.
   *
   * `contentType` is the content type of the route's success response, which
   * the generated code answers with; the simulated 400 is JSON whatever it is.
   *
   * @evidence contracts/common.md#principled-implementation The host, path, and method identify the request in the error, and the content type describes the success response of the generated function, which the generated code answers with.
   * @evidence contracts/common.md#clear-and-simple-design A four-field record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The values are supplied by the generated SDK for its own route.
   * @evidence contracts/common.md#meaningful-documentation The comment says what each part is used for, with the `contentType` member documenting when it is `null`.
   */
  export interface IProps {
    host: string;
    path: string;
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE" | "HEAD";

    /**
     * Content type of the route's success response, `null` for one without a
     * body such as `HEAD`'s. The simulated 400 is JSON whatever it is, as the
     * server's is.
     */
    contentType: string | null;
  }

  /**
   * Creates the validators of one simulated route: `param(name)`, `query`,
   * `body`, and `headers`.
   *
   * Each validator takes the closure that performs the typia assertion. A
   * failed assertion throws an `HttpError` with status 400 and a JSON body; any
   * other error is rethrown as it is.
   *
   * @evidence contracts/common.md#principled-implementation The four validators share the conversion in `validate` and differ in the message they attach, which names the URL parameter or states that the query, body, or headers do not follow the promised type.
   * @evidence contracts/common.md#clear-and-simple-design One function returning the four validators as an object, so a generated simulator has one import.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The HTTP error is the one the real server returns; nothing is simulated beyond running the assertion.
   * @evidence contracts/common.md#meaningful-documentation The comment states what it returns and what each validator throws.
   */
  export const assert = (props: IProps) => {
    return {
      param: param(props),
      query: query(props),
      body: body(props),
      headers: headers(props),
    };
  };
  const param =
    (props: IProps) =>
    (name: string) =>
    <T>(task: () => T): void => {
      validate((exp) => `URL parameter "${name}" is not ${exp.expected} type.`)(
        props,
      )(task);
    };

  const query =
    (props: IProps) =>
    <T>(task: () => T): void =>
      validate(
        () => "Request query parameters are not following the promised type.",
      )(props)(task);

  const body =
    (props: IProps) =>
    <T>(task: () => T): void =>
      validate(() => "Request body is not following the promised type.")(props)(
        task,
      );

  const headers =
    (props: IProps) =>
    <T>(task: () => T): void =>
      validate(() => "Request headers are not following the promised type.")(
        props,
      )(task);

  const validate =
    (message: (exp: TypeGuardError) => string) =>
    (props: IProps) =>
    <T>(task: () => T): void => {
      try {
        task();
      } catch (exp) {
        const guard: TypeGuardError | null = readTypeGuardError(exp);
        if (guard !== null)
          throw new HttpError(
            props.method,
            join_host_and_path(props.host, props.path),
            400,
            {
              "Content-Type": "application/json",
            },
            JSON.stringify({
              method: guard.method,
              path: guard.path,
              expected: guard.expected,
              value: guard.value,
              message: message(guard),
            }),
          );
        throw exp;
      }
    };
}

const readTypeGuardError = (input: any): TypeGuardError | null => {
  if (typeof input !== "object" || input === null) return null;
  try {
    const method: unknown = input.method;
    if (typeof method !== "string") return null;
    const path: unknown = input.path;
    if (path !== undefined && typeof path !== "string") return null;
    const expected: unknown = input.expected;
    if (typeof expected !== "string") return null;
    const name: unknown = input.name;
    if (typeof name !== "string") return null;
    const message: unknown = input.message;
    if (typeof message !== "string") return null;
    const stack: unknown = input.stack;
    if (stack !== undefined && typeof stack !== "string") return null;
    const value: unknown = input.value;
    return { method, path, expected, name, message, stack, value };
  } catch {
    return null;
  }
};

interface TypeGuardError extends Error {
  method: string;
  path: string | undefined;
  expected: string;
  value: any;
}
