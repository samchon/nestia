import { HttpError } from "./HttpError";

export namespace NestiaSimulator {
  export interface IProps {
    host: string;
    path: string;
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    contentType: string;
  }

  export const assert = (props: IProps) => {
    return {
      param: param(props),
      query: query(props),
      body: body(props),
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

  const validate =
    (message: (exp: TypeGuardError) => string, path?: string) =>
    (props: IProps) =>
    <T>(task: () => T): void => {
      try {
        task();
      } catch (exp) {
        if (isTypeGuardError(exp))
          throw new HttpError(
            props.method,
            props.host + props.path,
            400,
            {
              "Content-Type": props.contentType,
            },
            JSON.stringify({
              method: exp.method,
              path: path ?? exp.path,
              expected: exp.expected,
              value: exp.value,
              message: message(exp),
            }),
          );
        throw exp;
      }
    };
}

const isTypeGuardError = (input: any): input is TypeGuardError =>
  "string" === typeof input.method &&
  (undefined === input.path || "string" === typeof input.path) &&
  "string" === typeof input.expected &&
  "string" === typeof input.name &&
  "string" === typeof input.message &&
  (undefined === input.stack || "string" === typeof input.stack);

interface TypeGuardError extends Error {
  method: string;
  path: string | undefined;
  expected: string;
  value: any;
}
