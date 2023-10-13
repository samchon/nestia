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

                const wrapper: string = importer.external({
                    type: true,
                    library: "@nestia/fetcher",
                    instance:
                        route.output.contentType ===
                        "application/x-www-form-urlencoded"
                            ? "Resolved"
                            : "Primitive",
                });
                return `${wrapper}<${type}>`;
            }

            const propagation: string = importer.external({
                type: true,
                library: "@nestia/fetcher",
                instance: "IPropagation",
            });
            const branches: IBranch[] = [
                {
                    status: String(
                        route.status ?? (route.method === "POST" ? 201 : 200),
                    ),
                    type: name(config)(importer)(route.output),
                },
                ...Object.entries(route.exceptions).map(([status, value]) => ({
                    status,
                    type: name(config)(importer)(value),
                })),
            ];
            return (
                `${propagation}<{\n` +
                branches
                    .map(
                        (b) =>
                            `        ${
                                b.status.endsWith("XX")
                                    ? `"${b.status}"`
                                    : b.status
                            }: ${b.type};`,
                    )
                    .join("\n") +
                "\n" +
                `    }${route.status ? `, ${route.status}` : ""}>`
            );
        };

    export const responseBody =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (route: IRoute): string =>
            output({ ...config, propagate: false })(importer)(route);
}

interface IBranch {
    status: string;
    type: string;
}
