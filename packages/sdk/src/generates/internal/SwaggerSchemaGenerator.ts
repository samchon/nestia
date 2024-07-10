import { OpenApi } from "@samchon/openapi";
import { Singleton, VariadicSingleton } from "tstl";
import ts from "typescript";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { JsonApplicationProgrammer } from "typia/lib/programmers/json/JsonApplicationProgrammer";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";
import { ValidationPipe } from "typia/lib/typings/ValidationPipe";

import { INestiaConfig } from "../../INestiaConfig";
import { ISwaggerError } from "../../structures/ISwaggerError";
import { ISwaggerLazyProperty } from "../../structures/ISwaggerLazyProperty";
import { ISwaggerLazySchema } from "../../structures/ISwaggerLazySchema";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { SwaggerDescriptionGenerator } from "./SwaggerDescriptionGenerator";
import { SwaggerSchemaValidator } from "./SwaggerSchemaValidator";

export namespace SwaggerSchemaGenerator {
  export interface IProps {
    config: INestiaConfig.ISwaggerConfig;
    checker: ts.TypeChecker;
    collection: MetadataCollection;
    lazySchemas: Array<ISwaggerLazySchema>;
    lazyProperties: Array<ISwaggerLazyProperty>;
    errors: ISwaggerError[];
  }

  export const response =
    (props: IProps) =>
    (route: ITypedHttpRoute): Record<string, OpenApi.IOperation.IResponse> => {
      const output: Record<string, OpenApi.IOperation.IResponse> = {};

      //----
      // EXCEPTION STATUSES
      //----
      // FROM DECORATOR
      for (const [status, exp] of Object.entries(route.exceptions)) {
        const result = MetadataFactory.analyze(props.checker)({
          escape: true,
          constant: true,
          absorb: false,
          validate: JsonApplicationProgrammer.validate,
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
      for (const tag of route.jsDocTags) {
        if (tag.name !== "throw" && tag.name !== "throws") continue;

        const text: string | undefined = tag.text?.find(
          (elem) => elem.kind === "text",
        )?.text;
        if (text === undefined) continue;

        const elements: string[] = text.split(" ").map((str) => str.trim());
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
          elements.length === 1 ? undefined : elements.slice(1).join(" ");
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
          : route.method === "POST"
            ? "201"
            : "200";

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
          ? `${warning.get(!!description, "response", route.method)}${
              description ?? ""
            }`
          : description ?? "",
        content:
          route.output.typeName === "void"
            ? undefined
            : {
                [route.output.contentType]: {
                  schema: coalesce(props)(result),
                },
              },
        ...(props.config.additional === true
          ? {
              "x-nestia-encrypted": route.encrypted,
            }
          : route.encrypted === true
            ? {
                "x-nestia-encrypted": true,
              }
            : {}),
      };
      return output;
    };

  export const body =
    (props: IProps) =>
    (route: ITypedHttpRoute) =>
    (param: ITypedHttpRoute.IParameter): OpenApi.IOperation.IRequestBody => {
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
      const schema: OpenApi.IJsonSchema = coalesce(props)(result);
      return {
        description: encrypted
          ? `${warning.get(!!description, "request")}${description ?? ""}`
          : description,
        content: {
          [contentType]: {
            schema,
          },
        },
        required: true,
        ...(props.config.additional === true
          ? {
              "x-nestia-encrypted": encrypted,
            }
          : encrypted === true
            ? {
                "x-nestia-encrypted": true,
              }
            : {}),
      };
    };

  export const parameter =
    (props: IProps) =>
    (route: ITypedHttpRoute) =>
    (param: ITypedHttpRoute.IParameter): OpenApi.IOperation.IParameter[] =>
      param.category === "headers"
        ? headers(props)(route)(param)
        : param.category === "param"
          ? [path(props)(route)(param)]
          : query(props)(route)(param);

  const path =
    (props: IProps) =>
    (route: ITypedHttpRoute) =>
    (param: ITypedHttpRoute.IParameter): OpenApi.IOperation.IParameter => {
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
    (route: ITypedHttpRoute) =>
    (param: ITypedHttpRoute.IParameter): OpenApi.IOperation.IParameter[] =>
      decomposible(props)(route)(param)(
        MetadataFactory.analyze(props.checker)({
          escape: false,
          constant: true,
          absorb: true,
          validate: param.custom ? SwaggerSchemaValidator.headers : undefined,
        })(props.collection)(param.type),
      );

  const query =
    (props: IProps) =>
    (route: ITypedHttpRoute) =>
    (param: ITypedHttpRoute.IParameter): OpenApi.IOperation.IParameter[] =>
      decomposible(props)(route)(param)(
        MetadataFactory.analyze(props.checker)({
          escape: false,
          constant: true,
          absorb: true,
          validate: param.custom ? SwaggerSchemaValidator.query : undefined,
        })(props.collection)(param.type),
      );

  const decomposible =
    (props: IProps) =>
    (route: ITypedHttpRoute) =>
    (param: ITypedHttpRoute.IParameter) =>
    (
      result: ValidationPipe<Metadata, MetadataFactory.IError>,
    ): OpenApi.IOperation.IParameter[] => {
      const decoded: OpenApi.IOperation.IParameter = lazy(props)(route)(
        param,
        result,
      );
      if (result.success === false) {
        props.errors.push(
          ...result.errors.map((e) => ({
            ...e,
            route,
            from: param.name,
          })),
        );
        return [decoded];
      } else if (
        props.config.decompose === false ||
        result.data.objects.length === 0
      )
        return [decoded];

      return result.data.objects[0].properties
        .filter((p) => p.jsDocTags.every((tag) => tag.name !== "hidden"))
        .map((p) => {
          const schema: OpenApi.IJsonSchema = {};
          props.lazyProperties.push({
            schema,
            object: result.data.objects[0].name,
            property: p.key.constants[0].values[0].value as string,
          });
          return {
            name: p.key.constants[0].values[0].value as string,
            in:
              param.category === "headers"
                ? "header"
                : (param.category as "path"),
            schema,
            required: p.value.isRequired(),
            ...SwaggerDescriptionGenerator.generate({
              description: p.description ?? undefined,
              jsDocTags: p.jsDocTags,
              kind: "title",
            }),
          } satisfies OpenApi.IOperation.IParameter;
        });
    };

  const lazy =
    (props: IProps) =>
    (route: ITypedHttpRoute) =>
    (
      p: ITypedHttpRoute.IParameter,
      result: ValidationPipe<Metadata, MetadataFactory.IError>,
    ): OpenApi.IOperation.IParameter => {
      const schema: OpenApi.IJsonSchema = coalesce(props)(result);
      return {
        name: p.field ?? p.name,
        in:
          p.category === "headers"
            ? "header"
            : p.category === "param"
              ? "path"
              : "query",
        schema,
        ...SwaggerDescriptionGenerator.generate({
          description:
            p.description ??
            p.jsDocTags.find((tag) => tag.name === "description")?.text?.[0]
              .text ??
            route.jsDocTags
              .find(
                (tag) => tag.name === "param" && tag.text?.[0].text === p.name,
              )
              ?.text?.map((e) => e.text)
              .join("")
              .substring(p.name.length),
          jsDocTags: p.jsDocTags,
          kind: "title",
        }),
      };
    };

  const coalesce =
    (props: IProps) =>
    (
      result: ValidationPipe<Metadata, MetadataFactory.IError>,
    ): OpenApi.IJsonSchema => {
      const schema: OpenApi.IJsonSchema = {} as any;
      props.lazySchemas.push({
        metadata: result.success ? result.data : any.get(),
        schema,
      });
      return schema;
    };

  const describe = (
    route: ITypedHttpRoute,
    tagName: string,
    parameterName?: string,
  ): string | undefined => {
    const parametric: (elem: ts.JSDocTagInfo) => boolean = parameterName
      ? (tag) =>
          tag.text!.find(
            (elem) =>
              elem.kind === "parameterName" && elem.text === parameterName,
          ) !== undefined
      : () => true;

    const tag: ts.JSDocTagInfo | undefined = route.jsDocTags.find(
      (tag) => tag.name === tagName && tag.text && parametric(tag),
    );
    return tag && tag.text
      ? tag.text.find((elem) => elem.kind === "text")?.text
      : undefined;
  };
}

const warning = new VariadicSingleton(
  (described: boolean, type: "request" | "response", method?: string) => {
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
    if (described === true) content.push("", "----------------", "", "");
    return content.join("\n");
  },
);

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
      aliases: new Map(),
      arrays: new Map(),
      tuples: new Map(),
      objects: new Map(),
    },
  ),
);
