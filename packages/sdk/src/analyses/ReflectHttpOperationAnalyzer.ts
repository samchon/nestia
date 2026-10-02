import { METHOD_METADATA, PATH_METADATA } from "@nestjs/common/constants";
import { ranges } from "tstl";

import { INestiaProject } from "../structures/INestiaProject";
import { IOperationMetadata } from "../structures/IOperationMetadata";
import { IReflectController } from "../structures/IReflectController";
import { IReflectHttpOperation } from "../structures/IReflectHttpOperation";
import { IReflectHttpOperationParameter } from "../structures/IReflectHttpOperationParameter";
import { IReflectHttpOperationSuccess } from "../structures/IReflectHttpOperationSuccess";
import { IReflectOperationError } from "../structures/IReflectOperationError";
import { ArrayUtil } from "../utils/ArrayUtil";
import { ImportAnalyzer } from "./ImportAnalyzer";
import { PathAnalyzer } from "./PathAnalyzer";
import { ReflectHttpOperationExceptionAnalyzer } from "./ReflectHttpOperationExceptionAnalyzer";
import { ReflectHttpOperationParameterAnalyzer } from "./ReflectHttpOperationParameterAnalyzer";
import { ReflectHttpOperationResponseAnalyzer } from "./ReflectHttpOperationResponseAnalyzer";
import { ReflectMetadataAnalyzer } from "./ReflectMetadataAnalyzer";

/**
 * Reflects an HTTP route method into an operation.
 *
 * @evidence contracts/common.md#principled-implementation The method, the path list, the parameters, the success response, the exceptions, the imports, the security, and the extensions are composed from Nest's metadata and the compile-time metadata, and the path parameters of the decorator are checked against the parameter decorators.
 * @evidence contracts/common.md#clear-and-simple-design One public function over the parameter, response, and exception analyzers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The checks follow the decorators and no route is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation ReflectHttpOperationAnalyzer analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
 */
export namespace ReflectHttpOperationAnalyzer {
  /**
   * The input of the HTTP operation analysis: the project, the controller, the
   * method, and its compile-time metadata.
   *
   * @evidence contracts/common.md#principled-implementation The record holds the reflected function and the metadata the transform attached to it.
   * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes and the meaning of its members.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation ReflectHttpOperationAnalyzer.IProps analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export interface IProps {
    project: Omit<INestiaProject, "config"> &
      Partial<Pick<INestiaProject, "config">>;
    controller: IReflectController;
    function: Function;
    name: string;
    metadata: IOperationMetadata;
  }
  /**
   * Returns the reflected HTTP operation, or `null` when the method is not a
   * route or has errors, which are pushed to the project.
   *
   * @evidence contracts/common.md#principled-implementation A method is a route when it has Nest's path and method metadata; `ALL` is treated as POST and OPTIONS is skipped; a mismatch between the path parameters and the parameter decorators is an error.
   * @evidence contracts/common.md#clear-and-simple-design One function that collects errors and returns nothing when there is one.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The rules follow the HTTP semantics of the decorators.
   * @evidence contracts/common.md#meaningful-documentation The comment states the null result and the collected errors.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation ReflectHttpOperationAnalyzer.analyze analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const analyze = (props: IProps): IReflectHttpOperation | null => {
    if (
      ArrayUtil.has(
        Reflect.getMetadataKeys(props.function),
        PATH_METADATA,
        METHOD_METADATA,
      ) === false
    )
      return null;

    const errors: IReflectOperationError[] = [];
    const method: string =
      METHODS[Reflect.getMetadata(METHOD_METADATA, props.function)]!;
    if (method === undefined || method === "OPTIONS") return null;

    const parameters: IReflectHttpOperationParameter[] =
      ReflectHttpOperationParameterAnalyzer.analyze({
        controller: props.controller,
        metadata: props.metadata,
        httpMethod: method,
        function: props.function,
        functionName: props.name,
        errors,
      });
    const success: IReflectHttpOperationSuccess | null =
      ReflectHttpOperationResponseAnalyzer.analyze({
        controller: props.controller,
        function: props.function,
        functionName: props.name,
        httpMethod: method,
        metadata: props.metadata,
        errors,
      });
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
        if (PathAnalyzer.wildcard(str)) {
          props.project.warnings.push({
            file: props.controller.file,
            class: props.controller.class.name,
            function: props.name,
            from: "",
            contents: ["@nestia/sdk does not compose wildcard method."],
          });
          return false;
        }
        return true;
      }),
      versions: ReflectMetadataAnalyzer.versions(props.function),
      parameters,
      success,
      security: ReflectMetadataAnalyzer.securities(props.function),
      exceptions: ReflectHttpOperationExceptionAnalyzer.analyze({
        controller: props.controller,
        function: props.function,
        functionName: props.name,
        httpMethod: method,
        metadata: props.metadata,
        errors,
      }),
      tags: Reflect.getMetadata("swagger/apiUseTags", props.function) ?? [],
      imports: ImportAnalyzer.merge(
        [
          ...props.metadata.parameters
            .filter((x) => parameters.some((y) => x.index === y.index))
            .map((x) => x.imports),
          ...(success.binary === true ? [] : props.metadata.success.imports),
          ...(props.project.config?.propagate === true
            ? Object.values(props.metadata.exceptions).map((e) => e.imports)
            : []),
        ].flat(),
      ),
      description: props.metadata.description,
      jsDocTags: props.metadata.jsDocTags,
      operationId: props.metadata.jsDocTags
        .find(({ name }) => name === "operationId")
        ?.text?.[0]?.text.trim()
        .split(/\s+/)[0],
      extensions: ReflectMetadataAnalyzer.extensions(props.function),
    };

    // VALIDATE PATH ARGUMENTS
    for (const controllerLocation of props.controller.paths)
      for (const metaLocation of operation.paths) {
        // NORMALIZE LOCATION
        const location: string = PathAnalyzer.join(
          controllerLocation,
          metaLocation,
        );
        if (PathAnalyzer.wildcard(location)) continue;

        // LIST UP PARAMETERS
        const binded: string[] | null = PathAnalyzer.parameters(location);
        if (binded === null) {
          errors.push({
            file: props.controller.file,
            class: props.controller.class.name,
            function: props.name,
            from: "{parameters}",
            contents: [`invalid path (${JSON.stringify(location)})`],
          });
          continue;
        }
        const parameters: string[] = operation.parameters
          .filter((param) => param.category === "param")
          .map((param) => param.field!)
          .sort();

        // DO VALIDATE
        if (ranges.equal(binded.sort(), parameters) === false)
          errors.push({
            file: props.controller.file,
            class: props.controller.class.name,
            function: props.name,
            from: "{parameters}",
            contents: [
              `binded arguments in the "path" between function's decorator and parameters' decorators are different (function: [${binded.join(
                ", ",
              )}], parameters: [${parameters.join(", ")}]).`,
            ],
          });
      }

    // RETURNS
    if (errors.length) {
      props.project.errors.push(...errors);
      return null;
    }
    return operation;
  };
}

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
