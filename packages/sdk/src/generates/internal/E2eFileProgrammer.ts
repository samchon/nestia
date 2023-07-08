import fs from "fs";
import path from "path";

import { INestiaConfig } from "../../INestiaConfig";
import { IRoute } from "../../structures/IRoute";
import { ImportDictionary } from "../../utils/ImportDictionary";
import { PathUtil } from "../../utils/PathUtil";

export namespace E2eFileProgrammer {
    export const generate =
        (config: INestiaConfig) =>
        (counter: (path: string) => number) =>
        (props: { api: string; current: string }) =>
        async (route: IRoute): Promise<void> => {
            const importDict: ImportDictionary = new ImportDictionary();
            for (const tuple of route.imports)
                for (const instance of tuple[1])
                    importDict.emplace(tuple[0], false, instance);

            const additional: string[] = [];
            for (const param of route.parameters) {
                const type = getAdditional(param);
                if (type === "uuid") additional.push(UUID);
                else if (type === "date") additional.push(DATE);
            }

            const content: string = [
                ...(!!route.parameters.filter((p) => getAdditional(p) === null)
                    .length || route.output.name !== "void"
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
                arrow(config)(counter)(route),
                ...(additional.length ? ["", ...additional] : []),
            ].join("\n");

            await fs.promises.writeFile(
                `${props.current}/${name(counter)(route)}.ts`,
                content,
                "utf8",
            );
        };

    const arrow =
        (config: INestiaConfig) =>
        (counter: (path: string) => number) =>
        (route: IRoute): string => {
            const tab: number = route.output.name === "void" ? 2 : 3;
            const output = [
                `await ${accessor(counter)(route)}(`,
                `${" ".repeat(tab * 4)}connection,`,
                ...route.parameters.map(parameter(config)(tab)),
                `${" ".repeat((tab - 1) * 4)});`,
            ].join("\n");
            return [
                `export const ${name(counter)(route)} = async (`,
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

    const name =
        (counter: (path: string) => number) =>
        (route: IRoute): string =>
            "test_api_" +
            postfix(counter)(PathUtil.accessors(route.path))(route.name).join(
                "_",
            );

    const accessor =
        (counter: (path: string) => number) =>
        (route: IRoute): string =>
            "api.functional." +
            postfix(counter)(PathUtil.accessors(route.path))(route.name).join(
                ".",
            );

    const postfix =
        (counter: (path: string) => number) =>
        (array: string[]) =>
        (name: string) =>
            array.at(-1) === name && counter(array.join("/")) < 2
                ? array
                : [...array, name];

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
