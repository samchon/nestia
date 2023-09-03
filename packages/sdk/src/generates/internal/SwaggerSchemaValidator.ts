import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";
import { MetadataArray } from "typia/lib/schemas/metadata/MetadataArray";

export namespace SwaggerSchemaValidator {
    export const path = (meta: Metadata): string[] => {
        const errors: string[] = [];
        const insert = (msg: string) => errors.push(msg);

        if (meta.any) insert("do not allow any type");
        if (meta.isRequired() === false)
            insert("do not allow undefindable type");

        const atomics = CoreMetadataUtil.atomics(meta);
        const expected: number =
            meta.atomics.length +
            meta.templates.length +
            meta.constants
                .map((c) => c.values.length)
                .reduce((a, b) => a + b, 0);
        if (meta.size() !== expected || atomics.size === 0)
            insert("only atomic or constant types are allowed");
        if (atomics.size > 1) insert("do not allow union type");

        return errors;
    };

    export const query = (
        meta: Metadata,
        explore: MetadataFactory.IExplore,
    ): string[] => {
        const errors: string[] = [];
        const insert = (msg: string) => errors.push(msg);

        if (explore.top === true) {
            // TOP MUST BE ONLY OBJECT
            if (meta.objects.length !== 1 || meta.bucket() !== 1)
                insert("only one object type is allowed.");
            if (meta.nullable === true)
                insert("query parameters cannot be null.");
            if (meta.isRequired() === false)
                insert("query parameters cannot be undefined.");
        } else if (
            explore.nested !== null &&
            explore.nested instanceof MetadataArray
        ) {
            const atomics = CoreMetadataUtil.atomics(meta);
            const expected: number =
                meta.atomics.length +
                meta.templates.length +
                meta.constants
                    .map((c) => c.values.length)
                    .reduce((a, b) => a + b, 0);
            if (atomics.size > 1) insert("union type is not allowed in array.");
            if (meta.nullable) insert("nullable type is not allowed in array.");
            if (meta.isRequired() === false)
                insert("optional type is not allowed in array.");
            if (meta.size() !== expected)
                insert("only atomic or constant types are allowed in array.");
        } else if (explore.object && explore.property !== null) {
            //----
            // COMMON
            //----
            // PROPERTY MUST BE SOLE
            if (typeof explore.property === "object")
                insert("dynamic property is not allowed.");
            // DO NOT ALLOW TUPLE TYPE
            if (meta.tuples.length) insert("tuple type is not allowed.");
            // DO NOT ALLOW UNION TYPE
            if (CoreMetadataUtil.isUnion(meta))
                insert("union type is not allowed.");
            // DO NOT ALLOW NESTED OBJECT
            if (
                meta.objects.length ||
                meta.sets.length ||
                meta.maps.length ||
                meta.natives.length
            )
                insert("nested object type is not allowed.");

            //----
            // ARRAY CASES
            //----
            const isArray: boolean =
                meta.arrays.length > 1 || meta.tuples.length > 1;
            // ARRAY TYPE MUST BE REQUIRED
            if (isArray && meta.isRequired() === false)
                insert("optional type is not allowed when array.");
            // SET-COOKIE MUST BE ARRAY
            if (explore.property === "set-cookie" && !isArray)
                insert("set-cookie property must be array.");
        }
        return errors;
    };

    export const headers = (
        meta: Metadata,
        explore: MetadataFactory.IExplore,
    ): string[] => {
        const errors: string[] = [];
        const insert = (msg: string) => errors.push(msg);

        if (explore.top === true) {
            // TOP MUST BE ONLY OBJECT
            if (meta.objects.length !== 1 || meta.bucket() !== 1)
                insert("only one object type is allowed.");
            if (meta.nullable === true) insert("headers cannot be null.");
            if (meta.isRequired() === false) insert("headers cannot be null.");
        } else if (
            explore.nested !== null &&
            explore.nested instanceof MetadataArray
        ) {
            const atomics = CoreMetadataUtil.atomics(meta);
            const expected: number =
                meta.atomics.length +
                meta.templates.length +
                meta.constants
                    .map((c) => c.values.length)
                    .reduce((a, b) => a + b, 0);
            if (atomics.size > 1) insert("union type is not allowed in array.");
            if (meta.nullable) insert("nullable type is not allowed in array.");
            if (meta.isRequired() === false)
                insert("optional type is not allowed.");
            if (meta.size() !== expected)
                insert("only atomic or constant types are allowed in array.");
        } else if (explore.object && explore.property !== null) {
            //----
            // COMMON
            //----
            // PROPERTY MUST BE SOLE
            if (typeof explore.property === "object")
                insert("dynamic property is not allowed.");
            // DO NOT ALLOW TUPLE TYPE
            if (meta.tuples.length) insert("tuple type is not allowed.");
            // DO NOT ALLOW UNION TYPE
            if (CoreMetadataUtil.isUnion(meta))
                insert("union type is not allowed.");
            // DO NOT ALLOW NESTED OBJECT
            if (
                meta.objects.length ||
                meta.sets.length ||
                meta.maps.length ||
                meta.natives.length
            )
                insert("nested object type is not allowed.");
            // DO NOT ALLOW NULLABLE
            if (meta.nullable) insert("nullable type is not allowed.");

            //----
            // ARRAY CASES
            //----
            const isArray: boolean = meta.arrays.length > 1;
            // ARRAY TYPE MUST BE REQUIRED
            if (isArray && meta.isRequired() === false)
                insert("optional type is not allowed when array.");
            // SET-COOKIE MUST BE ARRAY
            if (explore.property === "set-cookie" && !isArray)
                insert("set-cookie property must be array.");
            // MUST BE SINGULAR CASE
            if (
                typeof explore.property === "string" &&
                SINGULAR.has(explore.property) &&
                isArray
            )
                insert("property cannot be array.");
        }
        return errors;
    };
}

namespace CoreMetadataUtil {
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

const SINGULAR: Set<string> = new Set([
    "age",
    "authorization",
    "content-length",
    "content-type",
    "etag",
    "expires",
    "from",
    "host",
    "if-modified-since",
    "if-unmodified-since",
    "last-modified",
    "location",
    "max-forwards",
    "proxy-authorization",
    "referer",
    "retry-after",
    "server",
    "user-agent",
]);
