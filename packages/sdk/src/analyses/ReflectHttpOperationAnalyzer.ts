import {
  METHOD_METADATA,
  PATH_METADATA,
  SSE_METADATA,
} from "@nestjs/common/constants";
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

export namespace ReflectHttpOperationAnalyzer {
  export interface IProps {
    project: Omit<INestiaProject, "config"> &
      Partial<Pick<INestiaProject, "config">>;
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

    const errors: IReflectOperationError[] = [];
    const method: string =
      METHODS[Reflect.getMetadata(METHOD_METADATA, props.function)]!;
    if (method === undefined || method === "OPTIONS") return null;

    // a server-sent events route answers `text/event-stream`, not the JSON
    // of its return type, which neither an SDK function nor the document can
    // describe, so it is left out as a route of no composable path is
    if (Reflect.getMetadata(SSE_METADATA, props.function) === true) {
      props.project.warnings.push({
        file: props.controller.file,
        class: props.controller.class.name,
        function: props.name,
        from: "",
        contents: [
          `@nestia/sdk does not compose server-sent events method (@Sse()).`,
        ],
      });
      return null;
    }

    // a route no path of which can be composed is left out as a whole,
    // rather than composed at the controller's own path
    const paths: string[] = ReflectMetadataAnalyzer.paths(
      props.function,
    ).filter((str) => {
      const reason = PathAnalyzer.unsupported(str);
      if (reason === null) return true;
      props.project.warnings.push({
        file: props.controller.file,
        class: props.controller.class.name,
        function: props.name,
        from: "",
        contents: [
          `@nestia/sdk does not compose ${reason} method (${JSON.stringify(str)}).`,
        ],
      });
      return false;
    });
    if (paths.length === 0) return null;

    const parameters: IReflectHttpOperationParameter[] =
      ReflectHttpOperationParameterAnalyzer.analyze({
        controller: props.controller,
        metadata: props.metadata,
        httpMethod: method,
        function: props.function,
        functionName: props.name,
        errors,
      });
    const success: IReflectHttpOperationSuccess | null = (() => {
      const localErrors: IReflectOperationError[] = [];
      const success = ReflectHttpOperationResponseAnalyzer.analyze({
        controller: props.controller,
        function: props.function,
        functionName: props.name,
        httpMethod: method,
        metadata: props.metadata,
        errors,
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
      paths,
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

        // LIST UP PARAMETERS
        const binded: string[] | null = PathAnalyzer.parameters(location);
        if (binded === null) {
          props.project.errors.push({
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
