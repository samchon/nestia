import fs from "fs";
import ts from "typescript";

import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { IJsDocTagInfo } from "typia/lib/schemas/metadata/IJsDocTagInfo";
import { IMetadataTypeTag } from "typia/lib/schemas/metadata/IMetadataTypeTag";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";
import { MetadataAlias } from "typia/lib/schemas/metadata/MetadataAlias";
import { MetadataArray } from "typia/lib/schemas/metadata/MetadataArray";
import { MetadataAtomic } from "typia/lib/schemas/metadata/MetadataAtomic";
import { MetadataConstant } from "typia/lib/schemas/metadata/MetadataConstant";
import { MetadataEscaped } from "typia/lib/schemas/metadata/MetadataEscaped";
import { MetadataObject } from "typia/lib/schemas/metadata/MetadataObject";
import { MetadataProperty } from "typia/lib/schemas/metadata/MetadataProperty";
import { MetadataTuple } from "typia/lib/schemas/metadata/MetadataTuple";
import { Escaper } from "typia/lib/utils/Escaper";

import { INestiaConfig } from "../../INestiaConfig";
import { IRoute } from "../../structures/IRoute";
import { ImportDictionary } from "../../utils/ImportDictionary";
import { MapUtil } from "../../utils/MapUtil";

export namespace SdkDtoGenerator {
    export const generate =
        (checker: ts.TypeChecker) =>
        (config: INestiaConfig) =>
        async (routes: IRoute[]): Promise<void> => {
            try {
                await fs.promises.mkdir(`${config.output}/structures`);
            } catch {}

            const collection = new MetadataCollection({
                replace: MetadataCollection.replace,
            });
            for (const r of routes) {
                for (const p of r.parameters) {
                    const res = MetadataFactory.analyze(checker)({
                        escape: false,
                        constant: true,
                        absorb: false,
                    })(collection)(p.type);
                    if (res.success) p.metadata = res.data;
                }
                for (const e of Object.values(r.exceptions)) {
                    const res = MetadataFactory.analyze(checker)({
                        escape: true,
                        constant: true,
                        absorb: false,
                    })(collection)(e.type);
                    if (res.success) e.metadata = res.data;
                }
                const res = MetadataFactory.analyze(checker)({
                    escape: true,
                    constant: true,
                    absorb: false,
                })(collection)(r.output.type);
                if (res.success) r.output.metadata = res.data;
            }

            const modules: Map<string, IModule> = new Map();
            for (const alias of collection.aliases())
                prepare(modules)(alias.name)((importer) =>
                    defineAlias(config)(importer)(alias),
                );
            for (const object of collection.objects())
                prepare(modules)(object.name)((importer) =>
                    defineObject(config)(importer)(object),
                );

            for (const module of modules.values())
                await generateFile(config)(module);
        };

    const prepare =
        (dict: Map<string, IModule>) =>
        (name: string) =>
        (programmer: (importer: ImportDictionary) => string) => {
            const accessors: string[] = name.split(".");
            let module: IModule;

            accessors.forEach((acc, i) => {
                module = MapUtil.take(dict, acc, () => ({
                    name: accessors.slice(0, i + 1).join("."),
                    children: new Map(),
                }));
                if (i === accessors.length - 1) module.programmer = programmer;
                dict = module.children;
            });
            return module!;
        };

    const generateFile =
        (config: INestiaConfig) =>
        async (module: IModule): Promise<void> => {
            const importer: ImportDictionary = new ImportDictionary(
                `${config.output}/structures/${module.name}.ts`,
            );

            const body: string = writeModule(importer)(module);
            const content: string[] = [];
            if (!importer.empty())
                content.push(
                    importer.toScript(`${config.output}/structures`),
                    "",
                );
            content.push(body);

            await fs.promises.writeFile(
                importer.file,
                content.join("\n"),
                "utf8",
            );
        };

    const writeModule =
        (importer: ImportDictionary) =>
        (module: IModule): string => {
            const content: string[] = [];
            if (module.programmer) content.push(module.programmer(importer));
            if (module.children.size) {
                content.push(
                    `export namespace ${module.name.split(".").at(-1)} {`,
                );
                for (const child of module.children.values())
                    content.push(
                        writeModule(importer)(child)
                            .split("\n")
                            .map((l) => `    ${l}`)
                            .join("\n"),
                    );
                content.push("}");
            }
            return content.join("\n");
        };

    const defineAlias =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (alias: MetadataAlias) =>
            [
                ...writeComment(alias.value.atomics)(
                    alias.description,
                    alias.jsDocTags,
                ),
                `export type ${alias.name.split(".").at(-1)} = ${decode(config)(
                    importer,
                )(alias.value)};`,
            ].join("\n");

    const defineObject =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (object: MetadataObject) => {
            const top: string = [
                ...writeComment([])(
                    object.description ?? null,
                    object.jsDocTags,
                ),
                `export type ${object.name.split(".").at(-1)} = `,
            ].join("\n");
            if (object.properties.length === 0) return top + "{};";

            const regular: MetadataProperty[] = object.properties.filter((p) =>
                p.key.isSoleLiteral(),
            );
            const dynamic: MetadataProperty[] = object.properties.filter(
                (p) => !p.key.isSoleLiteral(),
            );

            const brackets: string[][] = [];
            if (regular.length) {
                const row: string[] = ["{"];
                for (const p of regular) {
                    const key: string = p.key.constants[0].values[0] as string;
                    const identifier: string = Escaper.variable(key)
                        ? key
                        : JSON.stringify(key);
                    row.push(
                        ...writeComment(p.value.atomics)(
                            p.description,
                            p.jsDocTags,
                        ).map((l) => `    ${l}`),
                        `    ${identifier}${
                            p.value.isRequired() === false ? "?" : ""
                        }: ${decode(config)(importer)(p.value)};`,
                    );
                }
                row.push("}");
                brackets.push(row);
            }
            for (const p of dynamic) {
                const row: string[] = ["{"];
                row.push(
                    ...writeComment(p.value.atomics)(
                        p.description,
                        p.jsDocTags,
                    ).map((l) => `    ${l}`),
                    `    [key: ${decode(config)(importer)(p.key)}]: ${decode(
                        config,
                    )(importer)(p.value)};`,
                );
                row.push("}");
                brackets.push(row);
            }
            return top + brackets.map((row) => row.join("\n")).join(" & ");
        };

    const writeComment =
        (atomics: MetadataAtomic[]) =>
        (description: string | null, jsDocTags: IJsDocTagInfo[]): string[] => {
            const lines: string[] = [];
            if (description?.length)
                lines.push(...description.split("\n").map((s) => `${s}`));

            const filtered: IJsDocTagInfo[] =
                !!atomics.length && !!jsDocTags?.length
                    ? jsDocTags.filter(
                          (tag) =>
                              !atomics.some((a) =>
                                  a.tags.some((r) =>
                                      r.some((t) => t.kind === tag.name),
                                  ),
                              ),
                      )
                    : jsDocTags ?? [];

            if (description?.length && filtered.length) lines.push("");
            if (filtered.length)
                lines.push(
                    ...filtered.map((t) =>
                        t.text?.length
                            ? `@${t.name} ${t.text.map((e) => e.text).join("")}`
                            : `@${t.name}`,
                    ),
                );
            if (lines.length === 0) return [];
            return ["/**", ...lines.map((s) => ` * ${s}`), " */"];
        };

    export const decode =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (meta: Metadata, parentEscaped: boolean = false): string => {
            const union: string[] = [];

            // COALESCES
            if (meta.any) union.push("any");
            if (meta.nullable) union.push("null");
            if (meta.isRequired() === false) union.push("undefined");
            if (parentEscaped === false && meta.escaped)
                union.push(decodeEscaped(config)(importer)(meta.escaped));

            // ATOMICS
            for (const atomic of meta.atomics)
                union.push(decodeAtomic(importer)(atomic));
            for (const constant of meta.constants)
                union.push(decodeConstant(constant));
            for (const tpl of meta.templates)
                union.push(decodeTemplate(config)(importer)(tpl));

            // ARRAYS
            for (const array of meta.arrays)
                union.push(decodeArray(config)(importer)(array));
            for (const tuple of meta.tuples)
                union.push(decodeTuple(config)(importer)(tuple));

            // OBJECTS
            for (const obj of meta.objects)
                union.push(decodeObject(config)(importer)(obj));
            for (const alias of meta.aliases)
                union.push(decodeAlias(config)(importer)(alias));

            // NATIVES
            for (const native of meta.natives) union.push(native);
            for (const set of meta.sets)
                union.push(`Set<${decode(config)(importer)(set)}>`);
            for (const map of meta.maps)
                union.push(
                    `Map<${decode(config)(importer)(map.key)}, ${decode(config)(
                        importer,
                    )(map.value)}>`,
                );
            return union.join(" | ");
        };

    const decodeEscaped =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (escaped: MetadataEscaped) => {
            if (
                escaped.original.size() === 1 &&
                escaped.original.natives.length === 1 &&
                escaped.original.natives[0] === "Date"
            )
                return `(string & ${importer.external({
                    type: true,
                    library: `typia/lib/tags/Format`,
                    instance: "Format",
                })}<"date-time">)`;
            return `(${decode(config)(importer)(escaped.returns, true)})`;
        };

    const decodeTypeTag =
        (importer: ImportDictionary) =>
        (tag: IMetadataTypeTag): string => {
            const front: string = tag.name.split("<")[0];
            if (NATIVE_TYPE_TAGS.has(front)) {
                importer.external({
                    type: true,
                    library: `typia/lib/tags/${front}`,
                    instance: front,
                });
                return tag.name;
            }
            importer.external({
                type: true,
                library: `typia/lib/tags/TagBase`,
                instance: "TagBase",
            });
            return `TagBase<${JSON.stringify(tag)}>`;
        };

    const decodeTypeTagMatrix =
        (importer: ImportDictionary) =>
        (base: string, tags: IMetadataTypeTag[][]): string => {
            if (tags.length === 0) return base;
            else if (tags.length === 1)
                return `(${base} & ${tags[0]
                    .map((t) => decodeTypeTag(importer)(t))
                    .join(" & ")})`;
            return (
                "(" +
                [
                    base,
                    ...tags.map(
                        (row) =>
                            `(${row
                                .map((t) => decodeTypeTag(importer)(t))
                                .join(" & ")})`,
                    ),
                ] +
                ")"
            );
        };

    const decodeAtomic =
        (importer: ImportDictionary) =>
        (atomic: MetadataAtomic): string =>
            decodeTypeTagMatrix(importer)(atomic.type, atomic.tags);

    const decodeTemplate =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (template: Metadata[]): string =>
            "`" +
            template
                .map((meta) =>
                    meta.size() === 1 &&
                    meta.isRequired() &&
                    meta.nullable === false &&
                    meta.constants.length === 1
                        ? String(meta.constants[0].values[0])
                              .split("`")
                              .join("\\`")
                        : `\${${decode(config)(importer)(meta)}}`,
                )
                .join("") +
            "`";

    const decodeConstant = (constant: MetadataConstant): string => {
        if (constant.values.length === 0)
            return JSON.stringify(constant.values[0]);
        return `(${constant.values
            .map((val) => JSON.stringify(val))
            .join(" | ")})`;
    };

    const decodeArray =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (array: MetadataArray): string =>
            decodeTypeTagMatrix(importer)(
                `Array<${decode(config)(importer)(array.type.value)}>`,
                array.tags,
            );

    const decodeTuple =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (tuple: MetadataTuple): string =>
            "[" +
            tuple.type.elements.map((e) =>
                e.rest
                    ? `...${decode(config)(importer)(e.rest)}[]`
                    : decode(config)(importer)(e),
            ) +
            "]";

    const decodeAlias =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (alias: MetadataAlias) => {
            importInternalFile(config)(importer)(alias.name);
            return alias.name;
        };

    const decodeObject =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (object: MetadataObject) => {
            importInternalFile(config)(importer)(object.name);
            return object.name;
        };

    const importInternalFile =
        (config: INestiaConfig) =>
        (importer: ImportDictionary) =>
        (name: string) => {
            const top = name.split(".")[0];
            if (importer.file === `${config.output}/structures/${top}.ts`)
                return;
            importer.internal({
                type: true,
                file: `${config.output}/structures/${name.split(".")[0]}`,
                instance: top,
            });
        };
}

const NATIVE_TYPE_TAGS = new Set([
    "ExclusiveMinimum",
    "ExclusiveMaximum",
    "Format",
    "Maximum",
    "MaxItems",
    "MaxLength",
    "Minimum",
    "MinItems",
    "MinLength",
    "MultipleOf",
    "Pattern",
    "Type",
]);

interface IModule {
    name: string;
    children: Map<string, IModule>;
    programmer?: (importer: ImportDictionary) => string;
}
