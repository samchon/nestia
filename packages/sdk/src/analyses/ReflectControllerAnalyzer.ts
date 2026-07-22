import {
  HOST_METADATA,
  PATH_METADATA,
  SCOPE_OPTIONS_METADATA,
} from "@nestjs/common/constants";

import { INestiaProject } from "../structures/INestiaProject";
import { INestiaSdkInput } from "../structures/INestiaSdkInput";
import { IOperationMetadata } from "../structures/IOperationMetadata";
import { IReflectController } from "../structures/IReflectController";
import { IReflectHttpOperation } from "../structures/IReflectHttpOperation";
import { IReflectMcpOperation } from "../structures/IReflectMcpOperation";
import { IReflectWebSocketOperation } from "../structures/IReflectWebSocketOperation";
import { ArrayUtil } from "../utils/ArrayUtil";
import { ReflectHttpOperationAnalyzer } from "./ReflectHttpOperationAnalyzer";
import { ReflectMcpOperationAnalyzer } from "./ReflectMcpOperationAnalyzer";
import { ReflectMetadataAnalyzer } from "./ReflectMetadataAnalyzer";
import { ReflectWebSocketOperationAnalyzer } from "./ReflectWebSocketOperationAnalyzer";

export namespace ReflectControllerAnalyzer {
  export interface IProps {
    project: Omit<INestiaProject, "config">;
    controller: INestiaSdkInput.IController;
    unique: WeakSet<Function>;
  }
  /* ---------------------------------------------------------
    CONTROLLER
  --------------------------------------------------------- */
  export const analyze = (props: IProps): IReflectController | null => {
    // MUST BE TYPE OF A CREATOR WHO HAS THE CONSTRUCTOR
    if (
      ArrayUtil.has(
        Reflect.getMetadataKeys(props.controller.class),
        PATH_METADATA,
        HOST_METADATA,
        SCOPE_OPTIONS_METADATA,
      ) === false
    )
      return null;

    // BASIC INFO
    const controller: IReflectController = {
      class: props.controller.class,
      file: props.controller.location,
      operations: [],
      prefixes: props.controller.prefixes,
      paths: ReflectMetadataAnalyzer.paths(props.controller.class).filter(
        (str) => {
          if (str.includes("*") === true) {
            props.project.warnings.push({
              file: props.controller.location,
              class: props.controller.class.name,
              function: null,
              from: null,
              contents: ["@nestia/sdk does not compose wildcard controller."],
            });
            return false;
          }
          return true;
        },
      ),
      versions: ReflectMetadataAnalyzer.versions(props.controller.class),
      security: ReflectMetadataAnalyzer.securities(props.controller.class),
      tags:
        Reflect.getMetadata("swagger/apiUseTags", props.controller.class) ?? [],
    };

    // OPERATORS
    for (const [key, value] of _Get_prototype_entries(props.controller.class)) {
      if (typeof value !== "function") continue;
      const metadata: IOperationMetadata | undefined = Reflect.getMetadata(
        "nestia/OperationMetadata",
        props.controller.class.prototype,
        key,
      );
      if (metadata === undefined) continue;
      else if (metadata.jsDocTags.some((tag) => tag.name === "ignore"))
        continue;
      const next: ReflectHttpOperationAnalyzer.IProps = {
        project: props.project,
        controller: controller,
        name: key,
        function: value,
        metadata,
      };
      const child:
        | IReflectHttpOperation
        | IReflectWebSocketOperation
        | IReflectMcpOperation
        | null =
        ReflectMcpOperationAnalyzer.analyze(next) ??
        ReflectWebSocketOperationAnalyzer.analyze(next) ??
        ReflectHttpOperationAnalyzer.analyze(next);
      if (child !== null) controller.operations.push(child);
    }
    return controller;
  };

  function _Get_prototype_entries(creator: any): Array<[string, unknown]> {
    const visited: Set<string> = new Set();
    return iterate(creator);

    function iterate(target: any): Array<[string, unknown]> {
      const keyList: string[] = Object.getOwnPropertyNames(
        target.prototype,
      ).filter((key) => {
        if (visited.has(key)) return false;
        visited.add(key);
        return true;
      });
      const entries: Array<[string, unknown]> = keyList.map((key) => [
        key,
        target.prototype[key],
      ]);

      const parent: any = Object.getPrototypeOf(target);
      if (parent.prototype !== undefined) entries.push(...iterate(parent));
      return entries;
    }
  }
}
