import path from "path";
import { Token, parse } from "path-to-regexp";

export namespace PathAnalyzer {
    export const join = (...args: string[]) =>
        "/" +
        _Trim(
            path
                .join(...args)
                .split("\\")
                .join("/"),
        );

    export const espace = (str: string, method: () => string) =>
        "/" +
        _Parse(str, method)
            .map((arg) => (arg.type === "param" ? `:${arg.value}` : arg.value))
            .join("/");

    export const parameters = (str: string, method: () => string) =>
        _Parse(str, method)
            .filter((arg) => arg.type === "param")
            .map((arg) => arg.value);

    function _Parse(str: string, method: () => string): IArgument[] {
        const tokens: Token[] = parse(path.join(str).split("\\").join("/"));
        const output: IArgument[] = [];

        for (const key of tokens) {
            if (typeof key === "string")
                output.push({
                    type: "path",
                    value: _Trim(key),
                });
            else if (typeof key.name === "number" || _Trim(key.name) === "")
                throw new Error(`Error on ${method}: ${ERROR_MESSAGE}.`);
            else
                output.push({
                    type: "param",
                    value: _Trim(key.name),
                });
        }
        return output;
    }

    function _Trim(str: string): string {
        if (str[0] === "/") str = str.substring(1);
        if (str[str.length - 1] === "/") str = str.substring(0, str.length - 1);
        return str;
    }

    interface IArgument {
        type: "param" | "path";
        value: string;
    }
}

const ERROR_MESSAGE = "nestia supports only string typed parameter on path";
