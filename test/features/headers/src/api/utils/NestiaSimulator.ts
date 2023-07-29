import { HttpError } from "@nestia/fetcher";

import typia from "typia";

export namespace NestiaSimulator {
    export interface IProps {
        host: string;
        path: string;
        method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
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
        (type: string) =>
        <T>(task: () => T): void => {
            validate(
                (exp) => `URL parameter "${name}" is not ${exp.expected} type.`,
            )(props)(
                type === "uuid"
                    ? uuid(task)
                    : type === "date"
                    ? date(task)
                    : task,
            );
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

    const uuid =
        <T>(task: () => T) =>
        () => {
            const value = task();
            return typia.assert<IUuid>({ value }).value as T;
        };

    const date =
        <T>(task: () => T) =>
        () => {
            const value = task();
            return typia.assert<IDate>({ value }).value as T;
        };

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

interface IUuid {
    /**
     * @format uuid
     */
    value: string | null;
}

interface IDate {
    /**
     * @format date
     */
    value: string | null;
}
