import {
  HOST_METADATA,
  PATH_METADATA,
  SCOPE_OPTIONS_METADATA,
} from "@nestjs/common/constants";

import { INestiaProject } from "../structures/INestiaProject";
import { IReflectController } from "../structures/IReflectController";
import { IReflectHttpOperation } from "../structures/IReflectHttpOperation";
import { IReflectWebSocketOperation } from "../structures/IReflectWebSocketOperation";
import { ArrayUtil } from "../utils/ArrayUtil";
import { ReflectHttpOperationAnalyzer } from "./ReflectHttpOperationAnalyzer";
import { ReflectMetadataAnalyzer } from "./ReflectMetadataAnalyzer";
import { ReflectWebSocketOperationAnalyzer } from "./ReflectWebSocketOperationAnalyzer";

type IModule = {
  [key: string]: any;
};

export namespace ReflectControllerAnalyzer {
  export const analyze =
    (project: INestiaProject) =>
    async (
      unique: WeakSet<any>,
      file: string,
      prefixes: string[],
      target?: Function,
    ): Promise<IReflectController[]> => {
      const module: IModule = await (async () => {
        try {
          return await import(file);
        } catch (exp) {
          console.log(
            ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",
          );
          console.log(`Error on "${file}" file. Check your code.`);
          console.log(exp);
          console.log(
            ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",
          );
          process.exit(-1);
        }
      })();
      const ret: IReflectController[] = [];

      for (const [key, value] of Object.entries(module)) {
        if (typeof value !== "function" || unique.has(value)) continue;
        else if ((target ?? value) !== value) continue;
        else unique.add(value);

        const result: IReflectController | null = _Analyze_controller(project)({
          file,
          name: key,
          creator: value,
          prefixes,
        });
        if (result !== null) ret.push(result);
      }
      return ret;
    };

  /* ---------------------------------------------------------
        CONTROLLER
    --------------------------------------------------------- */
  const _Analyze_controller =
    (project: INestiaProject) =>
    (props: {
      file: string;
      name: string;
      creator: any;
      prefixes: string[];
    }): IReflectController | null => {
      //----
      // VALIDATIONS
      //----
      // MUST BE TYPE OF A CREATOR WHO HAS THE CONSTRUCTOR
      if (
        !(
          props.creator instanceof Function &&
          props.creator.constructor instanceof Function
        )
      )
        return null;
      // MUST HAVE THOSE MATADATA
      else if (
        ArrayUtil.has(
          Reflect.getMetadataKeys(props.creator),
          PATH_METADATA,
          HOST_METADATA,
          SCOPE_OPTIONS_METADATA,
        ) === false
      )
        return null;

      //----
      // CONSTRUCTION
      //----
      // BASIC INFO
      const meta: IReflectController = {
        constructor: props.creator,
        prototype: props.creator.prototype,
        file: props.file,
        name: props.name,
        operations: [],
        prefixes: props.prefixes,
        paths: ReflectMetadataAnalyzer.paths(props.creator).filter((str) => {
          if (str.includes("*") === true) {
            project.warnings.push({
              file: props.file,
              controller: props.name,
              function: null,
              message: "@nestia/sdk does not compose wildcard controller.",
            });
            return false;
          }
          return true;
        }),
        versions: ReflectMetadataAnalyzer.versions(props.creator),
        security: ReflectMetadataAnalyzer.securities(props.creator),
        swaggerTgas:
          Reflect.getMetadata("swagger/apiUseTags", props.creator) ?? [],
      };

      // PARSE CHILDREN DATA
      for (const [key, value] of _Get_prototype_entries(props.creator)) {
        if (typeof value !== "function") continue;
        const next = {
          controller: meta,
          name: key,
          function: value,
        };
        const child: IReflectHttpOperation | IReflectWebSocketOperation | null =
          ReflectWebSocketOperationAnalyzer.analyze(project)(next) ??
          ReflectHttpOperationAnalyzer.analyze(project)(next);
        if (child !== null) meta.operations.push(child);
      }

      // RETURNS
      return meta;
    };

  function _Get_prototype_entries(creator: any): Array<[string, unknown]> {
    const keyList = Object.getOwnPropertyNames(creator.prototype);
    const entries: Array<[string, unknown]> = keyList.map((key) => [
      key,
      creator.prototype[key],
    ]);

    const parent = Object.getPrototypeOf(creator);
    if (parent.prototype !== undefined)
      entries.push(..._Get_prototype_entries(parent));

    return entries;
  }
}
