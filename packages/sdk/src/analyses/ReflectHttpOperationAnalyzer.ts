import {
  INTERCEPTORS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from "@nestjs/common/constants";
import { RouteParamtypes } from "@nestjs/common/enums/route-paramtypes.enum";
import { ranges } from "tstl";

import { IErrorReport } from "../structures/IErrorReport";
import { INestiaProject } from "../structures/INestiaProject";
import { IOperationMetadata } from "../structures/IOperationMetadata";
import { IReflectController } from "../structures/IReflectController";
import { IReflectHttpOperation } from "../structures/IReflectHttpOperation";
import { IReflectHttpOperationParameter } from "../structures/IReflectHttpOperationParameter";
import { IReflectHttpOperationSuccess } from "../structures/IReflectHttpOperationSuccess";
import { ParamCategory } from "../structures/ParamCategory";
import { ArrayUtil } from "../utils/ArrayUtil";
import { ImportAnalyzer } from "./ImportAnalyzer";
import { PathAnalyzer } from "./PathAnalyzer";
import { ReflectHttpOperationParameterAnalyzer } from "./ReflectHttpOperationParameterAnalyzer";
import { ReflectHttpOperationResponseAnalyzer } from "./ReflectHttpOperationResponseAnalyzer";
import { ReflectMetadataAnalyzer } from "./ReflectMetadataAnalyzer";

export namespace ReflectHttpOperationAnalyzer {
  export interface IProps {
    project: INestiaProject;
    controller: IReflectController;
    function: Function;
    name: string;
    metadata: IOperationMetadata;
  }
  export const analyze = (props: IProps): IReflectHttpOperation | null => {
    if (
      ArrayUtil.has(
        Reflect.getMetadataKeys(props.function),
        PATH_METADATA,
        METHOD_METADATA,
      ) === false
    )
      return null;

    const errors: IErrorReport[] = [];
    const method: string =
      METHODS[Reflect.getMetadata(METHOD_METADATA, props.function)];
    if (method === undefined || method === "OPTIONS") return null;

    const parameters: IReflectHttpOperationParameter[] =
      ReflectHttpOperationParameterAnalyzer.analyze({
        controller: props.controller,
        metadata: props.metadata,
        httpMethod: method,
        function: props.function,
        functionName: props.name,
        report: (message) =>
          errors.push({
            file: props.controller.file,
            controller: props.controller.class.name,
            function: props.name,
            message,
          }),
        isError: () => errors.length !== 0,
      });
    const success: IReflectHttpOperationSuccess | null = (() => {
      const localErrors: IErrorReport[] = [];
      const success = ReflectHttpOperationResponseAnalyzer.analyze({
        controller: props.controller,
        function: props.function,
        functionName: props.name,
        httpMethod: method,
        metadata: props.metadata,
        report: (message) =>
          localErrors.push({
            file: props.controller.file,
            controller: props.controller.class.name,
            function: props.name,
            message,
          }),
        isError: () => localErrors.length !== 0,
      });
      if (localErrors.length) {
        errors.push(...localErrors);
        return null;
      }
      return success;
    })();
    if (errors.length) {
      props.project.errors.push(...errors);
      return null;
    } else if (success === null) return null;

    // DO CONSTRUCT
    const operation: IReflectHttpOperation = {
      protocol: "http",
      function: props.function,
      name: props.name,
      method: method === "ALL" ? "POST" : method,
      paths: ReflectMetadataAnalyzer.paths(props.function).filter((str) => {
        if (str.includes("*") === true) {
          props.project.warnings.push({
            file: props.controller.file,
            controller: props.controller.class.name,
            function: props.name,
            message: "@nestia/sdk does not compose wildcard method.",
          });
          return false;
        }
        return true;
      }),
      versions: ReflectMetadataAnalyzer.versions(props.function),
      parameters,
      success,
      security: ReflectMetadataAnalyzer.securities(props.function),
      exceptions: {} as any,
      tags: Reflect.getMetadata("swagger/apiUseTags", props.function),
      imports: ImportAnalyzer.unique(
        [
          ...props.metadata.parameters
            .filter((x) => parameters.some((y) => x.index === y.index))
            .map((x) => x.imports),
          ...props.metadata.success.imports,
        ].flat(),
      ),
    };

    // VALIDATE PATH ARGUMENTS
    for (const controllerLocation of props.controller.paths)
      for (const metaLocation of operation.paths) {
        // NORMALIZE LOCATION
        const location: string = PathAnalyzer.join(
          controllerLocation,
          metaLocation,
        );
        if (location.includes("*")) continue;

        // LIST UP PARAMETERS
        const binded: string[] | null = PathAnalyzer.parameters(location);
        if (binded === null) {
          props.project.errors.push({
            file: props.controller.file,
            controller: props.controller.class.name,
            function: props.name,
            message: `invalid path (${JSON.stringify(location)})`,
          });
          continue;
        }
        const parameters: string[] = operation.parameters
          .filter((param) => param.kind === "param")
          .map((param) => param.field!)
          .sort();

        // DO VALIDATE
        if (ranges.equal(binded.sort(), parameters) === false)
          errors.push({
            file: props.controller.file,
            controller: props.controller.class.name,
            function: props.name,
            message: `binded arguments in the "path" between function's decorator and parameters' decorators are different (function: [${binded.join(
              ", ",
            )}], parameters: [${parameters.join(", ")}]).`,
          });
      }

    // RETURNS
    if (errors.length) {
      props.project.errors.push(...errors);
      return null;
    }
    return operation;
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
