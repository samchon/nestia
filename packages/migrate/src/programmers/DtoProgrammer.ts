import { IMigrateDto } from "../structures/IMigrateDto";
import { ISwaggerSchema } from "../structures/ISwaggeSchema";
import { ISwagger } from "../structures/ISwagger";
import { ISwaggerComponents } from "../structures/ISwaggerComponents";
import { MapUtil } from "../utils/MapUtil";
import { ImportProgrammer } from "./ImportProgrammer";
import { SchemaProgrammer } from "./SchemaProgrammer";

export namespace DtoProgrammer {
    export const analyze = (swagger: ISwagger): IMigrateDto[] => {
        const root: Modulo = new Modulo("");

        // COMPONENTS
        for (const [id, schema] of Object.entries(
            swagger.components.schemas ?? {},
        )) {
            const modulo = emplace(root)(id);
            modulo.dto.schema = schema;
        }
        return root.toDto().children;
    };

    const emplace = (modulo: Modulo) => (name: string) => {
        const identifiers: string[] = name.split(".");
        for (const key of identifiers)
            modulo = MapUtil.take(modulo.children)(key)(() => new Modulo(key));
        return modulo;
    };

    export const write =
        (components: ISwaggerComponents) =>
        (dto: IMigrateDto): string => {
            const references: ISwaggerSchema.IReference[] = [];
            const importer: ImportProgrammer = new ImportProgrammer(dto.name);
            const body: string = iterate(components)(references)(importer)(dto);

            const content: string[] = [
                ...importer.toScript((name) => `./${name}`, dto.name),
                ...(importer.empty() ? [] : [""]),
                body,
            ];
            return content.join("\n");
        };

    const iterate =
        (components: ISwaggerComponents) =>
        (references: ISwaggerSchema.IReference[]) =>
        (importer: ImportProgrammer) =>
        (dto: IMigrateDto): string => {
            const content: string[] = [];
            if (dto.schema) {
                const description: string | undefined = describe(dto.schema);
                content.push(
                    ...(description
                        ? [
                              "/**",
                              ...description.split("\n").map((l) => ` * ${l}`),
                              " */",
                          ]
                        : []),
                    `export type ${dto.name} = ${SchemaProgrammer.write(
                        components,
                    )(references)(importer)(dto.schema)}`,
                );
            }
            if (dto.children.length) {
                content.push(
                    `export namespace ${dto.name} {`,
                    ...dto.children.map((c) =>
                        iterate(components)(references)(importer)(c)
                            .split("\n")
                            .map((l) => `    ${l}`)
                            .join("\n"),
                    ),
                    `}`,
                );
            }
            return content.join("\n");
        };

    const describe = (schema: ISwaggerSchema): string | undefined => {
        const content: string[] = [];
        const add = (text: string) => {
            if (schema.description && !schema.description.includes(text))
                content.push(text);
        };
        if (schema.description) {
            content.push(...schema.description.split("\n"));
            if (!schema.description.split("\n").at(-1)?.startsWith("@"))
                content.push("");
        }
        if (schema.deprecated) add("@deprecated");
        if (schema.title) add(`@title ${schema.title}`);
        return content.length ? content.join("\n") : undefined;
    };
}

class Modulo {
    public readonly dto: IMigrateDto;
    public readonly children: Map<string, Modulo>;

    public constructor(name: string) {
        this.dto = {
            name,
            location: "src/api/structures",
            schema: null,
            children: [],
        };
        this.children = new Map();
    }

    public toDto(): IMigrateDto {
        this.dto.children = Array.from(this.children.values()).map((modulo) =>
            modulo.toDto(),
        );
        return this.dto;
    }
}
