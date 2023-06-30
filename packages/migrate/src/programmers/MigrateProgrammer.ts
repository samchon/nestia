import fs from "fs";

import { IAsset } from "../structures/IAsset";
import { IProgramController } from "../structures/IProgramController";
import { ISwaggerSchema } from "../structures/ISwaggeSchema";

export namespace MigrateProgrammer {
    export const write =
        (asset: IAsset) =>
        async (controllers: IProgramController[]): Promise<void> => {};

    const writeController =
        (asset: IAsset) =>
        async (controller: IProgramController): Promise<void> => {};

    // const writeType =
    //     (asset: IAsset) =>
    //     (name: string) =>
    //     async (schema: ISwaggerSchema.IObject | ISwaggerSchema.IArray | ISwaggerSchema.ITuple): Promise<void> => {
    //         const file: string = `${asset.output}/${name}.ts`;
    //         const content: string = schema.type === 'object'
    //             ? object(schema)
    //             : schema.type === 'array'
    //                 ? Array.isArray(schema.items) ? tuple(schema as ISwaggerSchema.ITuple) : array(schema as ISwaggerSchema.IArray);
    //     };

    const decodeObject = (obj: ISwaggerSchema.IObject): string =>
        [
            `{`,
            ...Object.entries(obj.properties.map).map(
                ([key, value]) => `    ${key}: ${decodeSchema(value)}`,
            ),
            `}`,
        ].join("\n");

    const decodeArray = (array: ISwaggerSchema.IArray): string =>
        `Array<${decodeSchema(array.items)}>`;

    const decodeTuple = (tuple: ISwaggerSchema.ITuple): string =>
        [
            `[`,
            ...tuple.items
                .map((item) => {
                    const schema = decodeSchema(item);
                    return item["x-typia-rest"] ? `...${schema}` : schema;
                })
                .map((str) => `    ${str}`),
            `]`,
        ].join("\n");

    const decodeSchema = (schema: ISwaggerSchema): string => {};
}
