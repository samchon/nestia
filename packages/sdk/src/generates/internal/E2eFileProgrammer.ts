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

            const uuid: boolean = route.parameters.some(
                (p) => p.category === "param" && p.meta?.type === "uuid",
            );
            const content: string = [
                ...(route.parameters.length || route.output.name !== "void"
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
                ...(uuid ? ["", UUID] : []),
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
            const output = [
                `await ${accessor(route)}(`,
                `${" ".repeat(tab * 4)}connection,`,
                ...route.parameters.map(parameter(config)(tab)),
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
                param.category === "param" && param.meta?.type === "uuid"
                    ? param.meta.nullable
                        ? `Math.random() < .2 ? null : uuid()`
                        : `uuid()`
                    : `typia.random<${primitive(config)(param.type.name)}>()`;
            return `${" ".repeat(4 * tab)}${middle},`;
        };

    const name = (route: IRoute): string =>
        postfix([
            "test_api",
            ...route.path
                .split("/")
                .filter((str) => str.length && str[0] !== ":")
                .map(normalize),
        ])(route.name).join("_");

    const accessor = (route: IRoute): string =>
        postfix([
            "api.functional",
            ...route.path
                .split("/")
                .filter((str) => str.length && str[0] !== ":")
                .map(normalize),
        ])(route.name).join(".");

    const normalize = (str: string) =>
        str.split("-").join("_").split(".").join("_");

    const postfix = (array: string[]) => (name: string) =>
        array.at(-1) === name ? array : [...array, name];

    const primitive =
        (config: INestiaConfig) =>
        (name: string): string =>
            config.primitive !== false ? `Primitive<${name}>` : name;
}

const UUID = `const uuid = (): string =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });`;
