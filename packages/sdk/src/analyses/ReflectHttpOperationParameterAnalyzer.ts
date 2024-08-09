import { ROUTE_ARGS_METADATA } from "@nestjs/common/constants";
import { RouteParamtypes } from "@nestjs/common/enums/route-paramtypes.enum";

import { IOperationMetadata } from "../structures/IOperationMetadata";
import { IReflectController } from "../structures/IReflectController";
import { IReflectHttpOperationParameter } from "../structures/IReflectHttpOperationParameter";
import { IReflectTypeImport } from "../structures/IReflectTypeImport";

export namespace ReflectHttpOperationParameterAnalyzer {
  export interface IContext {
    controller: IReflectController;
    function: Function;
    functionName: string;
    httpMethod: string;
    metadata: IOperationMetadata;
    report: (message: string) => void;
    isError: () => boolean;
  }
  export const analyze = (ctx: IContext): IReflectHttpOperationParameter[] => {
    const preconfigured: IReflectHttpOperationParameter.IPreconfigured[] =
      analyzePreconfigured(ctx);
    const imports: IReflectTypeImport[] = [];
    const parameters: IReflectHttpOperationParameter[] = preconfigured
      .map((p): IReflectHttpOperationParameter | null => {
        // METADATA INFO
        const matched: IOperationMetadata.IParameter | undefined =
          ctx.metadata.parameters.find((x) => x.index === p.index);

        // VALIDATE TYPE
        if (matched === undefined)
          ctx.report(`Unable to find parameter type of the ${p.index} (th).`);
        else if (matched.schema === null || matched.type === null)
          ctx.report(
            `Failed to analyze the parameter type of the ${JSON.stringify(matched.name)}.`,
          );

        // VALIDATE KIND
        if (p.kind === "body" && p.field)
          ctx.report(`@Body() must not have a field name.`);
        else if (p.kind === "param" && !p.field)
          ctx.report(`@Param() must have a field name.`);

        if (ctx.isError()) return null;
        else if (
          matched === undefined ||
          matched.schema === null ||
          matched.type === null ||
          matched.required === false
        )
          return null;

        // COMPOSITION
        imports.push(...matched.imports);
        if (p.kind === "param")
          return {
            kind: p.kind,
            index: p.index,
            field: p.field!,
            name: matched.name,
            type: matched.type,
            schema: matched.schema,
            components: matched.components,
          };
        else if (p.kind === "query" || p.kind === "headers")
          return {
            kind: p.kind,
            index: p.index,
            field: p.field ?? null,
            name: matched.name,
            type: matched.type,
            schema: matched.schema,
            components: matched.components,
          };
        else if (p.kind === "body")
          return {
            kind: p.kind,
            index: p.index,
            encrypted: !!p.encrypted,
            contentType: p.contentType,
            name: matched.name,
            type: matched.type,
            schema: matched.schema,
            components: matched.components,
          };
        else {
          ctx.report(`Unknown kind of the parameter.`);
          return null;
        }
      })
      .filter((x): x is IReflectHttpOperationParameter => x !== null);

    //----
    // POST VALIDATIONS
    //----
    // GET AND HEAD METHOD
    if (
      (ctx.httpMethod === "GET" || ctx.httpMethod === "HEAD") &&
      parameters.some((x) => x.kind === "body")
    )
      ctx.report(`@Body() is not allowed in the ${ctx.httpMethod} method.`);

    // FIND DUPLICATED BODY
    if (parameters.filter((x) => x.kind === "body").length > 1)
      ctx.report(`Duplicated @Body() is not allowed.`);
    if (
      parameters.filter((x) => x.kind === "query" && x.field === null).length >
      1
    )
      ctx.report(`Duplicated @Query() without field name is not allowed.`);
    if (
      parameters.filter((x) => x.kind === "headers" && x.field === null)
        .length > 1
    )
      ctx.report(`Duplicated @Headers() without field name is not allowed.`);

    // FIND DUPLICATED FIELDS
    if (
      isUnique(
        parameters.filter((x) => x.kind === "param").map((x) => x.field),
      ) === false
    )
      ctx.report(`Duplicated field names of path are not allowed.`);
    if (
      isUnique(
        parameters
          .filter((x) => x.kind === "query")
          .filter((x) => x.field !== null)
          .map((x) => x.field!),
      ) === false
    )
      ctx.report(`Duplicated field names of query are not allowed.`);
    if (
      isUnique(
        parameters
          .filter((x) => x.kind === "headers")
          .filter((x) => x.field !== null)
          .map((x) => x.field!),
      ) === false
    )
      ctx.report(`Duplicated field names of headers are not allowed.`);
    return parameters;
  };

  const analyzePreconfigured = (
    props: IContext,
  ): IReflectHttpOperationParameter.IPreconfigured[] => {
    const dict: NestParameters | undefined = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      props.controller.constructor,
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
    const symbol: string = key.split(":")[0];
    if (symbol.indexOf("__custom") !== -1) return analyzeCustomParameter(param);

    const kind: IReflectHttpOperationParameter.IPreconfigured["kind"] | null =
      getNestParamType(Number(symbol[0]) as RouteParamtypes);
    if (kind === null) return null;
    if (kind === "body")
      return {
        kind: "body",
        index: param.index,
        field: param.data,
        contentType: "application/json",
      };
    else
      return {
        kind,
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
        kind: "body",
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
        kind: "headers",
        index: param.index,
        field: param.data,
      };
    else if (param.factory.name === "TypedParam")
      return {
        kind: "param",
        index: param.index,
        field: param.data,
      };
    else if (param.factory.name === "TypedQuery")
      return {
        kind: "query",
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
