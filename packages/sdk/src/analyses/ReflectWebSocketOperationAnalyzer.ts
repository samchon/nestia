import { ranges } from "tstl";
import typia from "typia";

import { IErrorReport } from "../structures/IErrorReport";
import { INestiaProject } from "../structures/INestiaProject";
import { IReflectController } from "../structures/IReflectController";
import { IReflectWebSocketOperation } from "../structures/IReflectWebSocketOperation";
import { PathAnalyzer } from "./PathAnalyzer";
import { ReflectMetadataAnalyzer } from "./ReflectMetadataAnalyzer";

export namespace ReflectWebSocketOperationAnalyzer {
  export const analyze =
    (project: INestiaProject) =>
    (props: {
      controller: IReflectController;
      function: Function;
      name: string;
    }): IReflectWebSocketOperation | null => {
      const route: { paths: string[] } | undefined = Reflect.getMetadata(
        "nestia/WebSocketRoute",
        props.function,
      );
      if (route === undefined) return null;

      const errors: IErrorReport[] = [];
      const everyParameters: IReflectWebSocketOperation.IParameter[] = (
        (Reflect.getMetadata(
          "nestia/WebSocketRoute/Parameters",
          props.controller.prototype,
          props.name,
        ) ?? []) as IReflectWebSocketOperation.IParameter[]
      ).sort((a, b) => a.index - b.index);
      const parameters: IReflectWebSocketOperation.IParameter[] =
        everyParameters.filter((p) => typia.is(p.category));

      if (parameters.find((p) => (p.category === "acceptor") === undefined))
        errors.push({
          file: props.controller.file,
          controller: props.controller.name,
          function: props.name,
          message: "@WebSocketRoute.Acceptor() is essentially required",
        });
      if (everyParameters.length !== props.function.length)
        errors.push({
          file: props.controller.file,
          controller: props.controller.name,
          function: props.name,
          message: [
            "Every parameters must be one of below:",
            "  - @WebSocketRoute.Acceptor()",
            "  - @WebSocketRoute.Driver()",
            "  - @WebSocketRoute.Header()",
            "  - @WebSocketRoute.Param()",
            "  - @WebSocketRoute.Query()",
          ].join("\n"),
        });

      const fields: string[] = everyParameters
        .filter((p) => p.category === "path")
        .map((p) => p.field)
        .sort();
      for (const cLoc of props.controller.paths)
        for (const mLoc of route.paths) {
          const location: string = PathAnalyzer.join(cLoc, mLoc);
          if (location.includes("*")) continue;

          const binded: string[] | null = PathAnalyzer.parameters(location);
          if (binded === null) {
            errors.push({
              file: props.controller.file,
              controller: props.controller.name,
              function: props.name,
              message: `invalid path (${JSON.stringify(location)})`,
            });
            continue;
          }
          if (ranges.equal(binded.sort(), fields) === false)
            errors.push({
              file: props.controller.file,
              controller: props.controller.name,
              function: props.name,
              message: `binded arguments in the "path" between function's decorator and parameters' decorators are different (function: [${binded.join(
                ", ",
              )}], parameters: [${fields.join(", ")}]).`,
            });
        }
      if (errors.length) {
        project.errors.push(...errors);
        return null;
      }
      return {
        protocol: "websocket",
        target: props.function,
        name: props.name,
        paths: route.paths,
        versions: ReflectMetadataAnalyzer.versions(props.function),
        parameters,
      };
    };
}
