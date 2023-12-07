import { HttpError } from "@nestia/fetcher";

import typia from "typia";

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
            validate(
                (exp) => `URL parameter "${name}" is not ${exp.expected} type.`,
            )(props)(task);
        };

    const query =
        (props: IProps) =>
        <T>(task: () => T): void =>
            validate(
                () =>
                    "Request query parameters are not following the promised type.",
            )(props)(task);

    const body =
        (props: IProps) =>
        <T>(task: () => T): void =>
            validate(() => "Request body is not following the promised type.")(
                props,
            )(task);

    const validate =
        (message: (exp: typia.TypeGuardError) => string, path?: string) =>
        (props: IProps) =>
        <T>(task: () => T): void => {
            try {
                task();
            } catch (exp) {
                if (typia.is<typia.TypeGuardError>(exp))
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
