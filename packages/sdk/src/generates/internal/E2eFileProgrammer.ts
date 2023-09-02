import fs from "fs";

import { INestiaConfig } from "../../INestiaConfig";
import { IRoute } from "../../structures/IRoute";
import { ImportDictionary } from "../../utils/ImportDictionary";
import { SdkImportWizard } from "./SdkImportWizard";

export namespace E2eFileProgrammer {
    export const generate =
        (config: INestiaConfig) =>
        (props: { api: string; current: string }) =>
        async (route: IRoute): Promise<void> => {
            const importer: ImportDictionary = new ImportDictionary();
            for (const tuple of route.imports)
                for (const instance of tuple[1])
                    importer.internal({
                        file: tuple[0],
                        type: true,
                        instance,
                    });

            importer.internal({
                type: false,
                file: props.api,
                instance: null,
                name: "api",
            });
            const body: string = arrow(config)(importer)(route);
            const content: string = [
                importer.toScript(props.current),
                "",
                body,
            ].join("\n");

            await fs.promises.writeFile(
                `${props.current}/${name(route)}.ts`,
                content,
                "utf8",
            );
        };

    const arrow =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (route: IRoute): string => {
            const tab: number = route.output.typeName === "void" ? 2 : 3;
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
                          `        ...${SdkImportWizard.typia(
                              importer,
                          )}.random<${headers.typeName}>(),`,
                          "    },",
                          "},",
                      ]
                          .map((line) => `${" ".repeat(tab * 4)}${line}`)
                          .join("\n")
                    : `${" ".repeat(tab * 4)}connection,`,
                ...route.parameters
                    .filter((param) => param.category !== "headers")
                    .map(parameter(config)(importer)(tab)),
                `${" ".repeat((tab - 1) * 4)});`,
            ].join("\n");
            return [
                `export const ${name(route)} = async (`,
                `    connection: api.IConnection`,
                `): Promise<void> => {`,
                ...(route.output.typeName === "void"
                    ? [`    ${output}`]
                    : [
                          `    const output: ${primitive(config)(importer)(
                              route.output.typeName,
                          )} = `,
                          `        ${output}`,
                          `    ${SdkImportWizard.typia(
                              importer,
                          )}.assert(output);`,
                      ]),
                `};`,
            ].join("\n");
        };

    const parameter =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (tab: number) =>
        (param: IRoute.IParameter): string => {
            const middle: string = `${SdkImportWizard.typia(
                importer,
            )}.random<${primitive(config)(importer)(param.typeName)}>()`;
            return `${" ".repeat(4 * tab)}${middle},`;
        };

    const name = (route: IRoute): string =>
        ["test", "api", ...route.accessors].join("_");

    const accessor = (route: IRoute): string =>
        ["api", "functional", ...route.accessors].join(".");

    const primitive =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (name: string): string =>
            config.primitive !== false
                ? `${SdkImportWizard.Primitive(importer)}<${name}>`
                : name;
}
