import { INestiaConfig } from "../../INestiaConfig";
import { IRoute } from "../../structures/IRoute";
import { ImportDictionary } from "../../utils/ImportDictionary";
import { SdkDtoGenerator } from "./SdkDtoGenerator";

export namespace SdkTypeDefiner {
    export const name =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (p: IRoute.IParameter | IRoute.IOutput): string =>
            p.metadata
                ? SdkDtoGenerator.decode(config)(importer)(p.metadata)
                : p.typeName;

    export const headers =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (param: IRoute.IParameter): string => {
            const type: string = name(config)(importer)(param);
            if (config.primitive === false) return type;

            const resolved: string = importer.external({
                type: true,
                library: "@nestia/fetcher",
                instance: "Resolved",
            });
            return `${resolved}<${type}>`;
        };

    export const query =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (param: IRoute.IParameter): string => {
            const type: string = name(config)(importer)(param);
            if (config.primitive === false) return type;

            const resolved: string = importer.external({
                type: true,
                library: "@nestia/fetcher",
                instance: "Resolved",
            });
            return `${resolved}<${type}>`;
        };

    export const input =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (param: IRoute.IParameter): string => {
            const type: string = name(config)(importer)(param);
            if (config.primitive === false) return type;

            const primitive: string = importer.external({
                type: true,
                library: "@nestia/fetcher",
                instance: "Primitive",
            });
            return `${primitive}<${type}>`;
        };

    export const output =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (route: IRoute): string => {
            if (config.propagate !== true) {
                const type: string = name(config)(importer)(route.output);
                if (type === "void" || config.primitive === false) return type;

                const primitive: string = importer.external({
                    type: true,
                    library: "@nestia/fetcher",
                    instance: "Primitive",
                });
                return `${primitive}<${type}>`;
            }

            const propagation: string = importer.external({
                type: true,
                library: "@nestia/fetcher",
                instance: "IPropagation",
            });
            const branches: IBranch[] = [
                {
                    body: name(config)(importer)(route.output),
                    status: route.status
                        ? String(route.status)
                        : route.method === "GET" ||
                          route.method === "DELETE" ||
                          route.method === "HEAD"
                        ? "200"
                        : "201",
                    success: "true",
                },
            ];
            for (const [key, value] of Object.entries(route.exceptions))
                branches.push({
                    body: name(config)(importer)(value),
                    status: key.endsWith("XX")
                        ? `${propagation}.StatusRange<${key}>`
                        : key,
                    success: "false",
                });
            branches.push({
                status: "number",
                body: "any",
                success: "boolean",
            });
            return (
                "\n" +
                branches
                    .map(
                        (b) =>
                            `    | ${propagation}<${b.status}, ${b.body}, ${b.success}>`,
                    )
                    .join("\n")
            );
        };
}

interface IBranch {
    body: string;
    status: string;
    success: string;
}
