import { ranges } from "tstl";

import { IErrorReport } from "../structures/IErrorReport";
import { INestiaProject } from "../structures/INestiaProject";
import { IOperationMetadata } from "../structures/IOperationMetadata";
import { IReflectController } from "../structures/IReflectController";
import { IReflectTypeImport } from "../structures/IReflectTypeImport";
import { IReflectWebSocketOperation } from "../structures/IReflectWebSocketOperation";
import { IReflectWebSocketOperationParameter } from "../structures/IReflectWebSocketOperationParameter";
import { StringUtil } from "../utils/StringUtil";
import { ImportAnalyzer } from "./ImportAnalyzer";
import { PathAnalyzer } from "./PathAnalyzer";
import { ReflectMetadataAnalyzer } from "./ReflectMetadataAnalyzer";

export namespace ReflectWebSocketOperationAnalyzer {
  export interface IProps {
    project: INestiaProject;
    controller: IReflectController;
    function: Function;
    name: string;
    metadata: IOperationMetadata;
  }
  export const analyze = (ctx: IProps): IReflectWebSocketOperation | null => {
    const route: { paths: string[] } | undefined = Reflect.getMetadata(
      "nestia/WebSocketRoute",
      ctx.function,
    );
    if (route === undefined) return null;

    const errors: IErrorReport[] = [];
    const report = (message: string): null => {
      errors.push({
        file: ctx.controller.file,
        controller: ctx.controller.class.name,
        function: ctx.name,
        message,
      });
      return null;
    };
    const preconfigured: IReflectWebSocketOperationParameter.IPreconfigured[] =
      (
        (Reflect.getMetadata(
          "nestia/WebSocketRoute/Parameters",
          ctx.controller.class.prototype,
          ctx.name,
        ) ?? []) as IReflectWebSocketOperationParameter[]
      ).sort((a, b) => a.index - b.index);
    if (preconfigured.find((p) => (p.kind === "acceptor") === undefined))
      report("@WebSocketRoute.Acceptor() is essentially required");
    if (preconfigured.length !== ctx.function.length)
      report(
        [
          "Every parameters must be one of below:",
          "  - @WebSocketRoute.Acceptor()",
          "  - @WebSocketRoute.Driver()",
          "  - @WebSocketRoute.Header()",
          "  - @WebSocketRoute.Param()",
          "  - @WebSocketRoute.Query()",
        ].join("\n"),
      );

    const imports: IReflectTypeImport[] = [];
    const parameters: IReflectWebSocketOperationParameter[] = preconfigured
      .map((p) => {
        // METADATA INFO
        const matched: IOperationMetadata.IParameter | undefined =
          ctx.metadata.parameters.find((m) => p.index === m.index);

        // VALIDATE PARAMETER
        if (matched === undefined)
          return report(
            `Unable to find parameter type of the ${p.index} (th).`,
          );
        else if (matched.schema === null || matched.type === null)
          return report(
            `Failed to analyze the parameter type of the ${JSON.stringify(matched.name)}.`,
          );
        else if (
          p.kind === "param" &&
          !(p as IReflectWebSocketOperationParameter.IParamParameter).field
            ?.length
        )
          return report(`@WebSocketRoute.Param() must have a field name.`);
        else if (
          p.kind === "acceptor" &&
          matched.type?.typeArguments?.length !== 3
        )
          return `@WebSocketRoute.Acceptor() must have three type arguments.`;
        else if (
          p.kind === "driver" &&
          matched.type?.typeArguments?.length !== 1
        )
          return report(
            `@WebSocketRoute.Driver() must have one type argument.`,
          );

        // COMPLETE COMPOSITION
        imports.push(...matched.imports);
        if (p.kind === "acceptor" || p.kind === "driver" || p.kind === "query")
          return {
            ...p,
            name: matched.name,
            type: matched.type,
          };
        else if (p.kind === "param")
          return {
            ...p,
            kind: "param",
            field: p.field!,
            name: matched.name,
            type: matched.type,
          } satisfies IReflectWebSocketOperationParameter.IParamParameter;

        // UNKNOWN TYPE, MAYBE NEW FEATURE
        return report(
          `@WebSocketRoute.${StringUtil.capitalize(p.kind)}() has not been supported yet. How about upgrading the nestia packages?`,
        );
      })
      .filter((p): p is IReflectWebSocketOperationParameter => !!p);

    const fields: string[] = preconfigured
      .filter((p) => p.kind === "param")
      .map((p) => p.field ?? "")
      .filter((field): field is string => !!field?.length)
      .sort();
    for (const cLoc of ctx.controller.paths)
      for (const mLoc of route.paths) {
        const location: string = PathAnalyzer.join(cLoc, mLoc);
        if (location.includes("*")) continue;

        const binded: string[] | null = PathAnalyzer.parameters(location);
        if (binded === null)
          report(`invalid path (${JSON.stringify(location)})`);
        else if (ranges.equal(binded.sort(), fields) === false)
          report(
            `binded arguments in the "path" between function's decorator and parameters' decorators are different (function: [${binded.join(
              ", ",
            )}], parameters: [${fields.join(", ")}]).`,
          );
      }
    if (errors.length) {
      ctx.project.errors.push(...errors);
      return null;
    }
    return {
      protocol: "websocket",
      name: ctx.name,
      paths: route.paths,
      function: ctx.function,
      versions: ReflectMetadataAnalyzer.versions(ctx.function),
      parameters,
      imports: ImportAnalyzer.unique(imports),
      description: ctx.metadata.description ?? null,
      jsDocTags: ctx.metadata.jsDocTags,
    };
  };
}
