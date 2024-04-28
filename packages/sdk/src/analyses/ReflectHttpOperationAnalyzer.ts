import {
  HEADERS_METADATA,
  HTTP_CODE_METADATA,
  INTERCEPTORS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
  ROUTE_ARGS_METADATA,
} from "@nestjs/common/constants";
import { RouteParamtypes } from "@nestjs/common/enums/route-paramtypes.enum";
import { ranges } from "tstl";

import { IErrorReport } from "../structures/IErrorReport";
import { INestiaProject } from "../structures/INestiaProject";
import { IReflectController } from "../structures/IReflectController";
import { IReflectHttpOperation } from "../structures/IReflectHttpOperation";
import { ParamCategory } from "../structures/ParamCategory";
import { ArrayUtil } from "../utils/ArrayUtil";
import { PathAnalyzer } from "./PathAnalyzer";
import { ReflectMetadataAnalyzer } from "./ReflectMetadataAnalyzer";

export namespace ReflectHttpOperationAnalyzer {
  export const analyze =
    (project: INestiaProject) =>
    (props: {
      controller: IReflectController;
      function: Function;
      name: string;
    }): IReflectHttpOperation | null => {
      if (
        ArrayUtil.has(
          Reflect.getMetadataKeys(props.function),
          PATH_METADATA,
          METHOD_METADATA,
        ) === false
      )
        return null;

      const errors: IErrorReport[] = [];

      //----
      // CONSTRUCTION
      //----
      // BASIC INFO
      const encrypted: boolean = hasInterceptor("EncryptedRouteInterceptor")(
        props.function,
      );
      const query: boolean = hasInterceptor("TypedQueryRouteInterceptor")(
        props.function,
      );
      const method: string =
        METHODS[Reflect.getMetadata(METHOD_METADATA, props.function)];
      if (method === undefined || method === "OPTIONS") return null;

      const parameters: IReflectHttpOperation.IParameter[] = (() => {
        const nestParameters: NestParameters | undefined = Reflect.getMetadata(
          ROUTE_ARGS_METADATA,
          props.controller.constructor,
          props.name,
        );
        if (nestParameters === undefined) return [];

        const output: IReflectHttpOperation.IParameter[] = [];
        for (const tuple of Object.entries(nestParameters)) {
          const child: IReflectHttpOperation.IParameter | null =
            _Analyze_http_parameter(...tuple);
          if (child !== null) output.push(child);
        }
        return output.sort((x, y) => x.index - y.index);
      })();

      // VALIDATE BODY
      const body: IReflectHttpOperation.IParameter | undefined =
        parameters.find((param) => param.category === "body");
      if (body !== undefined && (method === "GET" || method === "HEAD")) {
        project.errors.push({
          file: props.controller.file,
          controller: props.controller.name,
          function: props.name,
          message: `"body" parameter cannot be used in the "${method}" method.`,
        });
        return null;
      }

      // DO CONSTRUCT
      const meta: IReflectHttpOperation = {
        protocol: "http",
        function: props.function,
        name: props.name,
        method: method === "ALL" ? "POST" : method,
        paths: ReflectMetadataAnalyzer.paths(props.function).filter((str) => {
          if (str.includes("*") === true) {
            project.warnings.push({
              file: props.controller.file,
              controller: props.controller.name,
              function: props.name,
              message: "@nestia/sdk does not compose wildcard method.",
            });
            return false;
          }
          return true;
        }),
        versions: ReflectMetadataAnalyzer.versions(props.function),
        parameters,
        status: Reflect.getMetadata(HTTP_CODE_METADATA, props.function),
        encrypted,
        contentType: encrypted
          ? "text/plain"
          : query
            ? "application/x-www-form-urlencoded"
            : Reflect.getMetadata(HEADERS_METADATA, props.function)?.find(
                (h: Record<string, string>) =>
                  typeof h?.name === "string" &&
                  typeof h?.value === "string" &&
                  h.name.toLowerCase() === "content-type",
              )?.value ?? "application/json",
        security: ReflectMetadataAnalyzer.securities(props.function),
        exceptions: ReflectMetadataAnalyzer.exceptions(props.function),
        swaggerTags: [
          ...new Set([
            ...props.controller.swaggerTgas,
            ...(Reflect.getMetadata("swagger/apiUseTags", props.function) ??
              []),
          ]),
        ],
      };

      // VALIDATE PATH ARGUMENTS
      for (const controllerLocation of props.controller.paths)
        for (const metaLocation of meta.paths) {
          // NORMALIZE LOCATION
          const location: string = PathAnalyzer.join(
            controllerLocation,
            metaLocation,
          );
          if (location.includes("*")) continue;

          // LIST UP PARAMETERS
          const binded: string[] | null = PathAnalyzer.parameters(location);
          if (binded === null) {
            project.errors.push({
              file: props.controller.file,
              controller: props.controller.name,
              function: props.name,
              message: `invalid path (${JSON.stringify(location)})`,
            });
            continue;
          }
          const parameters: string[] = meta.parameters
            .filter((param) => param.category === "param")
            .map((param) => param.field!)
            .sort();

          // DO VALIDATE
          if (ranges.equal(binded.sort(), parameters) === false)
            errors.push({
              file: props.controller.file,
              controller: props.controller.name,
              function: props.name,
              message: `binded arguments in the "path" between function's decorator and parameters' decorators are different (function: [${binded.join(
                ", ",
              )}], parameters: [${parameters.join(", ")}]).`,
            });
        }

      // RETURNS
      if (errors.length) {
        project.errors.push(...errors);
        return null;
      }
      return meta;
    };

  function _Analyze_http_parameter(
    key: string,
    param: INestParam,
  ): IReflectHttpOperation.IParameter | null {
    const symbol: string = key.split(":")[0];
    if (symbol.indexOf("__custom") !== -1)
      return _Analyze_http_custom_parameter(param);

    const typeIndex: RouteParamtypes = Number(symbol[0]) as RouteParamtypes;
    if (isNaN(typeIndex) === true) return null;

    const type: ParamCategory | undefined = getNestParamType(typeIndex);
    if (type === undefined) return null;

    return {
      custom: false,
      name: key,
      category: type,
      index: param.index,
      field: param.data,
    };
  }

  function _Analyze_http_custom_parameter(
    param: INestParam,
  ): IReflectHttpOperation.IParameter | null {
    if (param.factory === undefined) return null;
    else if (
      param.factory.name === "EncryptedBody" ||
      param.factory.name === "PlainBody" ||
      param.factory.name === "TypedQueryBody" ||
      param.factory.name === "TypedBody" ||
      param.factory.name === "TypedFormDataBody"
    )
      return {
        custom: true,
        category: "body",
        index: param.index,
        name: param.name,
        field: param.data,
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
        custom: true,
        category: "headers",
        name: param.name,
        index: param.index,
        field: param.data,
      };
    else if (param.factory.name === "TypedParam")
      return {
        custom: true,
        category: "param",
        name: param.name,
        index: param.index,
        field: param.data,
      };
    else if (param.factory.name === "TypedQuery")
      return {
        custom: true,
        name: param.name,
        category: "query",
        index: param.index,
        field: undefined,
      };
    else return null;
  }
}

interface INestParam {
  name: string;
  index: number;
  factory?: (...args: any) => any;
  data: string | undefined;
}

type NestParameters = {
  [key: string]: INestParam;
};

const hasInterceptor =
  (name: string) =>
  (proto: any): boolean => {
    const meta = Reflect.getMetadata(INTERCEPTORS_METADATA, proto);
    if (Array.isArray(meta) === false) return false;
    return meta.some((elem) => elem?.constructor?.name === name);
  };

// https://github.com/nestjs/nest/blob/master/packages/common/enums/route-paramtypes.enum.ts
const getNestParamType = (value: RouteParamtypes) => {
  if (value === RouteParamtypes.BODY) return "body";
  else if (value === RouteParamtypes.HEADERS) return "headers";
  else if (value === RouteParamtypes.QUERY) return "query";
  else if (value === RouteParamtypes.PARAM) return "param";
  return undefined;
};

// node_modules/@nestjs/common/lib/enums/request-method.enum.ts
const METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "ALL",
  "OPTIONS",
  "HEAD",
];
