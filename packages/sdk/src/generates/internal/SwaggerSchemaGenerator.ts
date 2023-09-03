import { Singleton } from "tstl";
import ts from "typescript";

import { IJsonSchema } from "typia";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";
import { ValidationPipe } from "typia/lib/typings/ValidationPipe";

import { INestiaConfig } from "../../INestiaConfig";
import { IRoute } from "../../structures/IRoute";
import { ISwaggerError } from "../../structures/ISwaggerError";
import { ISwaggerRoute } from "../../structures/ISwaggerRoute";
import { ISwaggerSchemaTuple } from "../../structures/ISwaggerSchemaTuple";
import { SwaggerSchemaValidator } from "./SwaggerSchemaValidator";

export namespace SwaggerSchemaGenerator {
    export interface IProps {
        config: INestiaConfig.ISwaggerConfig;
        checker: ts.TypeChecker;
        collection: MetadataCollection;
        tuples: Array<ISwaggerSchemaTuple>;
        errors: ISwaggerError[];
    }

    export const response =
        (props: IProps) =>
        (route: IRoute): ISwaggerRoute.IResponseBody => {
            const output: ISwaggerRoute.IResponseBody = {};

            //----
            // EXCEPTION STATUSES
            //----
            // FROM DECORATOR
            for (const [status, exp] of Object.entries(route.exceptions)) {
                const result = MetadataFactory.analyze(props.checker)({
                    escape: true,
                    constant: true,
                    absorb: false,
                    validate: (meta) => {
                        const bigint: boolean =
                            meta.atomics.some((a) => a.type === "bigint") ||
                            meta.constants.some((a) => a.type === "bigint");
                        return bigint ? ["bigint type is not allowed."] : [];
                    },
                })(props.collection)(exp.type);
                if (result.success === false)
                    props.errors.push(
                        ...result.errors.map((e) => ({
                            ...e,
                            route,
                            from: `response(status: ${status})`,
                        })),
                    );

                output[status] = {
                    description: exp.description ?? "",
                    content: {
                        "application/json": {
                            schema: coalesce(props)(result),
                        },
                    },
                };
            }

            // FROM COMMENT TAGS -> ANY
            for (const tag of route.tags) {
                if (tag.name !== "throw" && tag.name !== "throws") continue;

                const text: string | undefined = tag.text?.find(
                    (elem) => elem.kind === "text",
                )?.text;
                if (text === undefined) continue;

                const elements: string[] = text
                    .split(" ")
                    .map((str) => str.trim());
                const status: string = elements[0];
                if (
                    isNaN(Number(status)) &&
                    status !== "2XX" &&
                    status !== "3XX" &&
                    status !== "4XX" &&
                    status !== "5XX"
                )
                    continue;

                const description: string | undefined =
                    elements.length === 1
                        ? undefined
                        : elements.slice(1).join(" ");
                const oldbie = output[status];
                if (description && oldbie !== undefined)
                    oldbie.description = description;
                else if (oldbie === undefined)
                    output[status] = {
                        description: description ?? "",
                        content: {
                            "application/json": {
                                schema: {},
                            },
                        },
                    };
            }

            //----
            // SUCCESS
            //----
            // STATUS
            const status: string =
                route.status !== undefined
                    ? String(route.status)
                    : route.method === "GET" ||
                      route.method === "HEAD" ||
                      route.method === "DELETE"
                    ? "200"
                    : "201";

            // SCHEMA
            const result = MetadataFactory.analyze(props.checker)({
                escape: true,
                constant: true,
                absorb: false,
                validate: (meta) => {
                    const bigint: boolean =
                        meta.atomics.some((a) => a.type === "bigint") ||
                        meta.constants.some((a) => a.type === "bigint");
                    return bigint ? ["bigint type is not allowed."] : [];
                },
            })(props.collection)(route.output.type);
            if (result.success === false)
                props.errors.push(
                    ...result.errors.map((e) => ({
                        ...e,
                        route,
                        from: "response",
                    })),
                );

            // DO ASSIGN
            const description =
                describe(route, "return") ?? describe(route, "returns");
            output[status] = {
                description: route.encrypted
                    ? `${warning
                          .get(!!description)
                          .get("response", route.method)}${description ?? ""}`
                    : description ?? "",
                content:
                    route.output.typeName === "void"
                        ? undefined
                        : {
                              [route.output.contentType]: {
                                  schema: coalesce(props)(result),
                              },
                          },
                "x-nestia-encrypted": route.encrypted,
            };
            return output;
        };

    export const body =
        (props: IProps) =>
        (route: IRoute) =>
        (param: IRoute.IParameter): ISwaggerRoute.IRequestBody => {
            // ANALZE TYPE WITH VALIDATION
            const result = MetadataFactory.analyze(props.checker)({
                escape: true,
                constant: true,
                absorb: true,
                validate: (meta) => {
                    const bigint: boolean =
                        meta.atomics.some((a) => a.type === "bigint") ||
                        meta.constants.some((a) => a.type === "bigint");
                    return bigint ? ["bigint type is not allowed."] : [];
                },
            })(props.collection)(param.type);
            if (result.success === false)
                props.errors.push(
                    ...result.errors.map((e) => ({
                        ...e,
                        route,
                        from: param.name,
                    })),
                );

            // LIST UP PROPERTIES
            const contentType =
                param.custom && param.category === "body"
                    ? param.contentType
                    : "application/json";
            const encrypted: boolean =
                param.custom && param.category === "body" && param.encrypted;
            const description: string | undefined = describe(
                route,
                "param",
                param.name,
            );

            // RETURNS WITH LAZY CONSTRUCTION
            const schema: IJsonSchema = coalesce(props)(result);
            return {
                description: encrypted
                    ? `${warning.get(!!description).get("request")}${
                          description ?? ""
                      }`
                    : description,
                content: {
                    [contentType]: {
                        schema,
                    },
                },
                required: true,
                "x-nestia-encrypted": encrypted,
            };
        };

    export const parameter =
        (props: IProps) =>
        (route: IRoute) =>
        (param: IRoute.IParameter): ISwaggerRoute.IParameter[] =>
            param.category === "headers"
                ? headers(props)(route)(param)
                : param.category === "param"
                ? [path(props)(route)(param)]
                : query(props)(route)(param);

    const path =
        (props: IProps) =>
        (route: IRoute) =>
        (param: IRoute.IParameter): ISwaggerRoute.IParameter => {
            // ANALZE TYPE WITH VALIDATION
            const result = MetadataFactory.analyze(props.checker)({
                escape: false,
                constant: true,
                absorb: true,
                validate: SwaggerSchemaValidator.path,
            })(props.collection)(param.type);
            if (result.success === false)
                props.errors.push(
                    ...result.errors.map((e) => ({
                        ...e,
                        route,
                        from: param.name,
                    })),
                );

            // RETURNS WITH LAZY CONSTRUCTION
            return lazy(props)(route)(param, result);
        };

    const headers =
        (props: IProps) =>
        (route: IRoute) =>
        (param: IRoute.IParameter): ISwaggerRoute.IParameter[] =>
            decomposible(props)(route)(param)(
                MetadataFactory.analyze(props.checker)({
                    escape: false,
                    constant: true,
                    absorb: true,
                    validate: param.custom
                        ? SwaggerSchemaValidator.headers
                        : undefined,
                })(new MetadataCollection())(param.type),
            );

    const query =
        (props: IProps) =>
        (route: IRoute) =>
        (param: IRoute.IParameter): ISwaggerRoute.IParameter[] =>
            decomposible(props)(route)(param)(
                MetadataFactory.analyze(props.checker)({
                    escape: false,
                    constant: true,
                    absorb: true,
                    validate: param.custom
                        ? SwaggerSchemaValidator.query
                        : undefined,
                })(new MetadataCollection())(param.type),
            );

    const decomposible =
        (props: IProps) =>
        (route: IRoute) =>
        (param: IRoute.IParameter) =>
        (
            result: ValidationPipe<Metadata, MetadataFactory.IError>,
        ): ISwaggerRoute.IParameter[] => {
            if (result.success === false) {
                props.errors.push(
                    ...result.errors.map((e) => ({
                        ...e,
                        route,
                        from: param.name,
                    })),
                );
                return [lazy(props)(route)(param, result)];
            } else if (
                props.config.decompose !== true ||
                result.data.objects.length === 0
            )
                return [lazy(props)(route)(param, result)];

            return result.data.objects[0].properties.map((p) => {
                const schema = coalesce(props)({
                    success: true,
                    data: p.value,
                });
                return {
                    name: p.key.constants[0].values[0] as string,
                    in:
                        param.category === "headers"
                            ? "header"
                            : param.category,
                    schema,
                    description: p.description ?? undefined,
                    required: p.value.isRequired(),
                };
            });
        };

    const lazy =
        (props: IProps) =>
        (route: IRoute) =>
        (
            param: IRoute.IParameter,
            result: ValidationPipe<Metadata, MetadataFactory.IError>,
        ): ISwaggerRoute.IParameter => {
            const schema: IJsonSchema = coalesce(props)(result);
            return {
                name: param.field ?? param.name,
                in: param.category === "headers" ? "header" : param.category,
                schema,
                description: describe(route, "param", param.name) ?? "",
                required: result.success ? result.data.isRequired() : true,
            };
        };

    const coalesce =
        (props: IProps) =>
        (
            result: ValidationPipe<Metadata, MetadataFactory.IError>,
        ): IJsonSchema => {
            const schema: IJsonSchema = {} as any;
            props.tuples.push({
                metadata: result.success ? result.data : any.get(),
                schema,
            });
            return schema;
        };

    const describe = (
        route: IRoute,
        tagName: string,
        parameterName?: string,
    ): string | undefined => {
        const parametric: (elem: ts.JSDocTagInfo) => boolean = parameterName
            ? (tag) =>
                  tag.text!.find(
                      (elem) =>
                          elem.kind === "parameterName" &&
                          elem.text === parameterName,
                  ) !== undefined
            : () => true;

        const tag: ts.JSDocTagInfo | undefined = route.tags.find(
            (tag) => tag.name === tagName && tag.text && parametric(tag),
        );
        return tag && tag.text
            ? tag.text.find((elem) => elem.kind === "text")?.text
            : undefined;
    };
}

const warning = new Singleton((described: boolean) => {
    return new Singleton((type: "request" | "response", method?: string) => {
        const summary =
            type === "request"
                ? "Request body must be encrypted."
                : "Response data have been encrypted.";
        const component =
            type === "request"
                ? "[EncryptedBody](https://github.com/samchon/@nestia/core#encryptedbody)"
                : `[EncryptedRoute.${method![0].toUpperCase()}.${method!
                      .substring(1)
                      .toLowerCase()}](https://github.com/samchon/@nestia/core#encryptedroute)`;

        const content: string[] = [
            "## Warning",
            "",
            summary,
            "",
            `The ${type} body data would be encrypted as "AES-128(256) / CBC mode / PKCS#5 Padding / Base64 Encoding", through the ${component} component.`,
            "",
            `Therefore, just utilize this swagger editor only for referencing. If you need to call the real API, using [SDK](https://github.com/samchon/nestia#software-development-kit) would be much better.`,
        ];
        if (described === true) content.push("----------------", "");
        return content.join("\n");
    });
});

const any = new Singleton(() =>
    Metadata.from(
        {
            any: true,
            required: true,
            optional: false,
            nullable: false,
            functional: false,
            atomics: [],
            constants: [],
            templates: [],
            escaped: null,
            rest: null,
            arrays: [],
            tuples: [],
            objects: [],
            aliases: [],
            natives: [],
            sets: [],
            maps: [],
        },
        {
            aliases: [],
            arrays: [],
            tuples: [],
            objects: [],
        },
    ),
);
