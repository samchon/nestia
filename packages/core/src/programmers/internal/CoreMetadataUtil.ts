import { Metadata } from "typia/lib/schemas/metadata/Metadata";

export namespace CoreMetadataUtil {
    export const atomics = (
        meta: Metadata,
    ): Set<"boolean" | "bigint" | "number" | "string"> =>
        new Set([
            ...meta.atomics.map((a) => a.type),
            ...meta.constants.map((c) => c.type),
            ...(meta.templates.length ? (["string"] as const) : []),
        ]);

    export const isUnion = (meta: Metadata): boolean =>
        atomics(meta).size +
            meta.arrays.length +
            meta.tuples.length +
            meta.natives.length +
            meta.maps.length +
            meta.objects.length >
        1;
}
