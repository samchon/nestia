import { SwaggerExample } from "@nestia/core";
import { ROUTE_ARGS_METADATA } from "@nestjs/common/constants";
import { RouteParamtypes } from "@nestjs/common/enums/route-paramtypes.enum";

import { JsonMetadataFactory } from "../internal/legacy";
import { IOperationMetadata } from "../structures/IOperationMetadata";
import { IReflectController } from "../structures/IReflectController";
import { IReflectHttpOperationParameter } from "../structures/IReflectHttpOperationParameter";
import { IReflectOperationError } from "../structures/IReflectOperationError";
import { TextPlainValidator } from "../validators/TextPlainValidator";
import { ParameterNameAnalyzer } from "./ParameterNameAnalyzer";
import { SwaggerExampleAnalyzer } from "./SwaggerExampleAnalyzer";

export namespace ReflectHttpOperationParameterAnalyzer {
  export interface IContext {
    controller: IReflectController;
    function: Function;
    functionName: string;
    httpMethod: string;
    metadata: IOperationMetadata;
    errors: IReflectOperationError[];
  }
  export const analyze = (ctx: IContext): IReflectHttpOperationParameter[] => {
    const preconfigured: IReflectHttpOperationParameter.IPreconfigured[] =
      analyzePreconfigured(ctx);
    const errors: IReflectOperationError[] = [];

    //----
    // FIND CONTRADICTIONS
    //----
    // GET AND HEAD METHOD
    const contradictErrors: string[] = [];
    const contradict = (message: string) => {
      contradictErrors.push(message);
    };
    for (const message of findUnsupportedPayloads(ctx)) contradict(message);
    if (
      (ctx.httpMethod === "GET" || ctx.httpMethod === "HEAD") &&
      preconfigured.some((x) => x.category === "body")
    )
      contradict(`@Body() is not allowed in the ${ctx.httpMethod} method.`);

    // FIND DUPLICATED BODY
    if (
      preconfigured.filter(
        (x) => x.category === "body" && x.field === undefined,
      ).length > 1
    )
      contradict(`Duplicated @Body() is not allowed.`);
    if (
      preconfigured.filter(
        (x) => x.category === "query" && x.field === undefined,
      ).length > 1
    )
      contradict(`Duplicated @Query() without field name is not allowed.`);
    if (
      preconfigured.filter(
        (x) => x.category === "headers" && x.field === undefined,
      ).length > 1
    )
      contradict(`Duplicated @Headers() without field name is not allowed.`);

    // FIND DUPLICATED FIELDS
    if (
      isUnique(
        preconfigured
          .filter((x) => x.category === "param")
          .map((x) => x.field)
          .filter((field) => field !== undefined),
      ) === false
    )
      contradict(`Duplicated field names of path are not allowed.`);
    if (
      isUnique(
        preconfigured
          .filter((x) => x.category === "query")
          .map((x) => x.field)
          .filter((field) => field !== undefined),
      ) === false
    )
      contradict(`Duplicated field names of query are not allowed.`);
    if (
      isUnique(
        preconfigured
          .filter((x) => x.category === "headers")
          .map((x) => x.field)
          .filter((field) => field !== undefined)
          // NestJS reads `req.headers[name.toLowerCase()]`
          .map((field) => field.toLowerCase()),
      ) === false
    )
      contradict(`Duplicated field names of headers are not allowed.`);
    if (contradictErrors.length)
      errors.push({
        file: ctx.controller.file,
        class: ctx.controller.class.name,
        function: ctx.functionName,
        from: "",
        contents: contradictErrors,
      });

    //----
    // COMPOSE PARAMETERS
    //----
    const declared: IReflectHttpOperationParameter[] = preconfigured
      .map((p): IReflectHttpOperationParameter | null => {
        // METADATA INFO
        const pErrorContents: Array<string | IOperationMetadata.IError> = [];
        const matched: IOperationMetadata.IParameter | undefined =
          ctx.metadata.parameters.find((x) => x.index === p.index);
        const report = () => {
          errors.push({
            file: ctx.controller.file,
            class: ctx.controller.class.name,
            function: ctx.functionName,
            // a destructured parameter has no name to report
            from: `parameter ${matched?.name ? JSON.stringify(matched.name) : `of ${p.index} th`}`,
            contents: pErrorContents,
          });
          return null;
        };

        // VALIDATE TYPE
        if (matched === undefined)
          pErrorContents.push(`Unable to find parameter type.`);
        else if (matched.type === null)
          pErrorContents.push(`Failed to get the type info.`);

        // CONSIDER KIND
        const pipe = (() => {
          if (matched === undefined) return null;
          return p.category === "body" &&
            (p.contentType === "application/json" || p.encrypted === true)
            ? matched.primitive
            : matched.resolved;
        })();
        const schema: IOperationMetadata.ISchema | null =
          pipe?.success === true ? pipe.data : null;
        // A type the metadata analysis could not read has no SDK or Swagger
        // form; dropping the parameter would leave a function that cannot
        // send what the route requires.
        if (pipe?.success === false) pErrorContents.push(...pipe.errors);
        if (p.category === "body" && p.field !== undefined)
          pErrorContents.push(`@Body() must not have a field name.`);
        else if (p.category === "param" && p.field === undefined)
          pErrorContents.push(`@Param() must have a field name.`);

        // The wire rules of the parameter's HTTP input: a type they reject
        // cannot be carried as a query string, headers, a path segment, or a
        // form, so the SDK would send garbage and the document would lie.
        const rule: keyof IOperationMetadata.IHttpRules | null = httpRuleOf(p);
        if (rule !== null && schema !== null)
          pErrorContents.push(...(schema.http?.[rule] ?? []));

        if (pErrorContents.length) return report();
        else if (
          matched === undefined ||
          matched.type === null ||
          schema === null
        )
          return null; // unreachable
        const { http: _http, ...shape } = schema;

        const example: SwaggerExample.IData<any> | undefined = (
          Reflect.getMetadata(
            "nestia/SwaggerExample/Parameters",
            ctx.controller.class.prototype,
            ctx.functionName,
          ) ?? []
        ).find((x: SwaggerExample.IData<any>) => x.index === matched.index);

        // COMPOSITION
        if (p.category === "param")
          return {
            category: p.category,
            index: p.index,
            field: p.field!,
            name: matched.name,
            type: matched.type,
            description: matched.description,
            jsDocTags: matched.jsDocTags,
            example: example?.example,
            examples: SwaggerExampleAnalyzer.examples(example),
            ...shape,
          };
        else if (p.category === "query")
          return {
            category: p.category,
            index: p.index,
            field: p.field ?? null,
            name: matched.name,
            type: matched.type,
            description: matched.description,
            jsDocTags: matched.jsDocTags,
            example: example?.example,
            examples: SwaggerExampleAnalyzer.examples(example),
            ...shape,
          };
        else if (p.category === "headers")
          return {
            category: p.category,
            index: p.index,
            field: p.field ?? null,
            name: matched.name,
            type: matched.type,
            description: matched.description,
            jsDocTags: matched.jsDocTags,
            example: example?.example,
            examples: SwaggerExampleAnalyzer.examples(example),
            ...shape,
          };
        else if (p.category === "body")
          return {
            category: p.category,
            index: p.index,
            encrypted: !!p.encrypted,
            contentType: p.contentType,
            name: matched.name,
            type: matched.type,
            validate:
              p.contentType === "application/json" || p.encrypted === true
                ? JsonMetadataFactory.validate
                : p.contentType === "text/plain"
                  ? TextPlainValidator.validate
                  : undefined,
            description: matched.description,
            jsDocTags: matched.jsDocTags,
            example: example?.example,
            examples: SwaggerExampleAnalyzer.examples(example),
            ...shape,
          };
        else {
          pErrorContents.push(`Unknown kind of the parameter.`);
          return report();
        }
      })
      .filter((x): x is IReflectHttpOperationParameter => x !== null);
    // a destructured parameter declares no name, so it is given one
    const parameters: IReflectHttpOperationParameter[] =
      ParameterNameAnalyzer.name(declared);

    const duplicated: string[] = findDuplicatedKeys(parameters);
    if (duplicated.length)
      errors.push({
        file: ctx.controller.file,
        class: ctx.controller.class.name,
        function: ctx.functionName,
        from: "",
        contents: duplicated,
      });
    if (errors.length) ctx.errors.push(...errors);
    return parameters;
  };

  /**
   * The HTTP input rules a parameter's type must satisfy, or `null` for a JSON
   * or text body, whose policies are checked on the TypeScript side.
   *
   * The rules are typia's, baked per parameter by the SDK transform (see
   * `nestiaSDKHttpRules`), because only this analyzer knows the decorator. A
   * typed decorator was already held to them by the core transform, so the
   * verdict is only news for a vanilla `@Query()`, `@Headers()`, or `@Param()`,
   * which no transform touches.
   */
  const httpRuleOf = (
    p: IReflectHttpOperationParameter.IPreconfigured,
  ): keyof IOperationMetadata.IHttpRules | null => {
    if (p.category === "param") return "param";
    else if (p.category === "query")
      return p.field !== undefined ? "field" : "query";
    else if (p.category === "headers")
      return p.field !== undefined ? "field" : "headers";
    else if (p.contentType === "application/x-www-form-urlencoded")
      return "query";
    else if (p.contentType === "multipart/form-data") return "formData";
    return null;
  };

  /**
   * Reports a route argument that carries request payload in a way the SDK
   * cannot describe.
   *
   * `@UploadedFile()` and `@UploadedFiles()` take files a multer interceptor
   * parsed under field names that live in the interceptor's closure, where no
   * generator can read them, and `@RawBody()` takes a buffer with no type at
   * all. Such a parameter used to be dropped without a word, leaving an SDK
   * function that cannot send what the route requires and a Swagger operation
   * without its request body. Context arguments (`@Req()`, `@Res()`, `@Ip()`,
   * and the like) carry nothing the client sends and stay ignored.
   */
  const findUnsupportedPayloads = (ctx: IContext): string[] => {
    const dict: NestParameters | undefined = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      ctx.controller.class,
      ctx.functionName,
    );
    return Object.keys(dict ?? {})
      .map((key) => Number(key.split(":")[0]))
      .map((type) =>
        type === RouteParamtypes.FILE || type === RouteParamtypes.FILES
          ? `@${type === RouteParamtypes.FILE ? "UploadedFile" : "UploadedFiles"}() is not supported: its multer field names are not readable, so the SDK could not send the files. Use @TypedFormData.Body(), or tag the method @ignore.`
          : type === RouteParamtypes.RAW_BODY
            ? `@RawBody() is not supported: a raw buffer has no type to describe. Use @PlainBody() or @TypedBody(), or tag the method @ignore.`
            : null,
      )
      .filter((message): message is string => message !== null);
  };

  /**
   * Reports a query key or header both a field parameter and the object
   * parameter of its category declare.
   *
   * On the wire they are one key: NestJS hands both parameters the same
   * `req.query.keyword`, and header names match case-insensitively, as NestJS
   * lowercases the name a `@Headers("X-Tenant")` reads. Documenting both lists
   * one `name` + `in` pair twice, which OpenAPI forbids, and the SDK would ask
   * its caller for the same key twice and send one of the two values. Like two
   * field parameters of the same name, the declaration is contradictory.
   */
  const findDuplicatedKeys = (
    parameters: IReflectHttpOperationParameter[],
  ): string[] => {
    const messages: string[] = [];
    for (const [category, normalize, noun] of [
      ["query", (key: string) => key, "Query key"],
      ["headers", (key: string) => key.toLowerCase(), "Header"],
    ] as const) {
      const fields: Map<string, string> = new Map();
      for (const p of parameters)
        if (p.category === category && p.field !== null)
          fields.set(normalize(p.field), p.field);
      for (const p of parameters) {
        if (p.category !== category || p.field !== null) continue;
        for (const key of objectKeys(p)) {
          const field: string | undefined = fields.get(normalize(key));
          if (field !== undefined)
            messages.push(
              `${noun} ${JSON.stringify(field)} is declared both by a field parameter and by the ${category} object.`,
            );
        }
      }
    }
    return messages;
  };

  /** Literal property keys of an object parameter's object type. */
  const objectKeys = (p: IReflectHttpOperationParameter): string[] => {
    const name: string | undefined = p.metadata.objects[0]?.name;
    const object = p.components.objects.find((o) => o.name === name);
    return (object?.properties ?? [])
      .map((property) => property.key.constants[0]?.values[0]?.value)
      .filter((key): key is string => typeof key === "string");
  };

  const analyzePreconfigured = (
    props: IContext,
  ): IReflectHttpOperationParameter.IPreconfigured[] => {
    const dict: NestParameters | undefined = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      props.controller.class,
      props.functionName,
    );
    if (dict === undefined) return [];
    return Object.entries(dict)
      .map(([key, param]) => analyzeHttpParameter(key, param))
      .filter(
        (x): x is IReflectHttpOperationParameter.IPreconfigured => x !== null,
      )
      .sort((x, y) => x.index - y.index);
  };

  const analyzeHttpParameter = (
    key: string,
    param: INestParam,
  ): IReflectHttpOperationParameter.IPreconfigured | null => {
    const symbol: string = key.split(":")[0]!;
    if (symbol.indexOf("__custom") !== -1) return analyzeCustomParameter(param);

    // the whole number: `RAW_BODY` is 12, which the first digit misread as 1
    const category:
      | IReflectHttpOperationParameter.IPreconfigured["category"]
      | null = getNestParamType(Number(symbol) as RouteParamtypes);
    if (category === null) return null;
    if (category === "body")
      return {
        category: "body",
        index: param.index,
        field: param.data,
        contentType: "application/json",
      };
    else
      return {
        category,
        index: param.index,
        field: param.data,
      };
  };

  const analyzeCustomParameter = (
    param: INestParam,
  ): IReflectHttpOperationParameter.IPreconfigured | null => {
    if (param.factory === undefined) return null;
    else if (
      param.factory.name === "EncryptedBody" ||
      param.factory.name === "PlainBody" ||
      param.factory.name === "TypedQueryBody" ||
      param.factory.name === "TypedBody" ||
      param.factory.name === "TypedFormDataBody"
    )
      return {
        category: "body",
        index: param.index,
        encrypted: param.factory.name === "EncryptedBody",
        contentType:
          param.factory.name === "PlainBody" ||
          param.factory.name === "EncryptedBody"
            ? "text/plain"
            : param.factory.name === "TypedQueryBody"
              ? "application/x-www-form-urlencoded"
              : param.factory.name === "TypedFormDataBody"
                ? "multipart/form-data"
                : "application/json",
      };
    else if (param.factory.name === "TypedHeaders")
      return {
        category: "headers",
        index: param.index,
        field: param.data,
      };
    else if (param.factory.name === "TypedParam")
      return {
        category: "param",
        index: param.index,
        field: param.data,
      };
    else if (param.factory.name === "TypedQuery")
      return {
        category: "query",
        index: param.index,
        field: undefined,
      };
    else return null;
  };

  const isUnique = (values: string[]) => new Set(values).size === values.length;
}

type NestParameters = {
  [key: string]: INestParam;
};
interface INestParam {
  name: string;
  index: number;
  factory?: (...args: any) => any;
  data: string | undefined;
}

const getNestParamType = (value: RouteParamtypes) => {
  if (value === RouteParamtypes.BODY) return "body";
  else if (value === RouteParamtypes.HEADERS) return "headers";
  else if (value === RouteParamtypes.QUERY) return "query";
  else if (value === RouteParamtypes.PARAM) return "param";
  return null;
};
