import fs from "fs";
import path from "path";

import { INestiaConfig } from "../../INestiaConfig";
import { IRoute } from "../../structures/IRoute";
import { ImportDictionary } from "../../utils/ImportDictionary";

export namespace E2eFileProgrammer {
    export const generate =
        (config: INestiaConfig) =>
        (props: { api: string; current: string }) =>
        async (route: IRoute): Promise<void> => {
            const importDict: ImportDictionary = new ImportDictionary();
            for (const tuple of route.imports)
                for (const instance of tuple[1])
                    importDict.emplace(tuple[0], false, instance);

            const additional: string[] = [];
            for (const param of route.parameters.filter(
                (p) => p.category !== "headers",
            )) {
                const type = getAdditional(param);
                if (type === "uuid") additional.push(UUID);
                else if (type === "date") additional.push(DATE);
            }

            const content: string = [
                ...(!!route.parameters.filter(
                    (p) =>
                        p.category !== "headers" && getAdditional(p) === null,
                ).length || route.output.name !== "void"
                    ? [
                          config.primitive === false
                              ? `import typia from "typia";`
                              : `import typia, { Primitive } from "typia";`,
                          "",
                      ]
                    : []),
                `import api from "./${path
                    .relative(props.current, props.api)
                    .split("\\")
                    .join("/")}";`,
                ...(importDict.empty()
                    ? []
                    : [importDict.toScript(props.current)]),
                "",
                arrow(config)(route),
                ...(additional.length ? ["", ...additional] : []),
            ].join("\n");

            await fs.promises.writeFile(
                `${props.current}/${name(route)}.ts`,
                content,
                "utf8",
            );
        };

    const arrow =
        (config: INestiaConfig) =>
        (route: IRoute): string => {
            const tab: number = route.output.name === "void" ? 2 : 3;
            const headers = route.parameters.find(
                (p) => p.category === "headers" && p.field === undefined,
            );
            const output = [
                `await ${accessor(route)}(`,
                headers !== undefined
                    ? [
                          "{",
                          "    ...connection,",
                          "    headers: {",
                          "        ...(connection.headers ?? {}),",
                          `        ...typia.random<${headers.type.name}>(),`,
                          "    },",
                          "},",
                      ]
                          .map((line) => `${" ".repeat(tab * 4)}${line}`)
                          .join("\n")
                    : `${" ".repeat(tab * 4)}connection,`,
                ...route.parameters
                    .filter((param) => param.category !== "headers")
                    .map(parameter(config)(tab)),
                `${" ".repeat((tab - 1) * 4)});`,
            ].join("\n");
            return [
                `export const ${name(route)} = async (`,
                `    connection: api.IConnection`,
                `): Promise<void> => {`,
                ...(route.output.name === "void"
                    ? [`    ${output}`]
                    : [
                          `    const output: ${primitive(config)(
                              route.output.name,
                          )} = `,
                          `        ${output}`,
                          `    typia.assert(output);`,
                      ]),
                `};`,
            ].join("\n");
        };

    const parameter =
        (config: INestiaConfig) =>
        (tab: number) =>
        (param: IRoute.IParameter): string => {
            const middle: string =
                param.category === "param" &&
                param.custom &&
                (param.meta?.type === "uuid" || param.meta?.type === "date")
                    ? param.meta.nullable
                        ? `Math.random() < .2 ? null : ${param.meta.type}()`
                        : `${param.meta.type}()`
                    : `typia.random<${primitive(config)(param.type.name)}>()`;
            return `${" ".repeat(4 * tab)}${middle},`;
        };

    const name = (route: IRoute): string =>
        ["test", "api", ...route.accessors].join("_");

    const accessor = (route: IRoute): string =>
        ["api", "functional", ...route.accessors].join(".");

    const primitive =
        (config: INestiaConfig) =>
        (name: string): string =>
            config.primitive !== false ? `Primitive<${name}>` : name;

    const getAdditional = (
        param: IRoute.IParameter,
    ): "uuid" | "date" | null => {
        if (param.custom === false || param.category !== "param" || !param.meta)
            return null;
        else if (param.meta.type === "uuid") return "uuid";
        else if (param.meta.type === "date") return "date";
        return null;
    };
}

const UUID = `const uuid = (): string =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });`;
const DATE = `const date = (): string => {
    const date: Date = new Date(Math.floor(Math.random() * Date.now() * 2));
    return [
        date.getFullYear(),
        (date.getMonth() + 1).toString().padStart(2, "0"),
        date.getDate().toString().padStart(2, "0"),
    ].join("-");
}`;
