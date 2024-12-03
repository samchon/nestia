import { ranges } from "tstl";

import { INestiaProject } from "../structures/INestiaProject";
import { IReflectController } from "../structures/IReflectController";
import { IReflectTypeImport } from "../structures/IReflectTypeImport";
import { IReflectWebSocketOperation } from "../structures/IReflectWebSocketOperation";
import { IReflectWebSocketOperationParameter } from "../structures/IReflectWebSocketOperationParameter";
import { IOperationMetadata } from "../transformers/IOperationMetadata";
import { StringUtil } from "../utils/StringUtil";
import { ImportAnalyzer } from "./ImportAnalyzer";
import { PathAnalyzer } from "./PathAnalyzer";
import { ReflectMetadataAnalyzer } from "./ReflectMetadataAnalyzer";

export namespace ReflectWebSocketOperationAnalyzer {
  export interface IProps {
    project: Omit<INestiaProject, "config">;
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

    // @todo -> detailing is required
    const errors: string[] = [];
    const preconfigured: IReflectWebSocketOperationParameter.IPreconfigured[] =
      (
        (Reflect.getMetadata(
          "nestia/WebSocketRoute/Parameters",
          ctx.controller.class.prototype,
          ctx.name,
        ) ?? []) as IReflectWebSocketOperationParameter[]
      ).sort((a, b) => a.index - b.index);
    if (preconfigured.find((p) => (p.category === "acceptor") === undefined))
      errors.push("@WebSocketRoute.Acceptor() is essentially required");
    if (preconfigured.length !== ctx.function.length)
      errors.push(
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
          return errors.push(
            `Unable to find parameter type of the ${p.index} (th).`,
          );
        else if (matched.type === null)
          return errors.push(
            `Failed to analyze the parameter type of the ${JSON.stringify(matched.name)}.`,
          );
        else if (
          p.category === "param" &&
          !(p as IReflectWebSocketOperationParameter.IParam).field?.length
        )
          return errors.push(`@WebSocketRoute.Param() must have a field name.`);
        else if (
          p.category === "acceptor" &&
          matched.type?.typeArguments?.length !== 3
        )
          return `@WebSocketRoute.Acceptor() must have three type arguments.`;
        else if (
          p.category === "driver" &&
          matched.type?.typeArguments?.length !== 1
        )
          return errors.push(
            `@WebSocketRoute.Driver() must have one type argument.`,
          );

        // COMPLETE COMPOSITION
        imports.push(
          ...matched.imports.filter(
            (i) =>
              !(
                i.file.includes("tgrid/lib") &&
                (i.file.endsWith("Driver.d.ts") ||
                  i.file.endsWith("WebSocketAcceptor.d.ts"))
              ),
          ),
        );
        if (
          p.category === "acceptor" ||
          p.category === "driver" ||
          p.category === "query"
        )
          return {
            ...p,
            name: matched.name,
            type: matched.type,
          };
        else if (p.category === "param")
          return {
            ...p,
            category: "param",
            field: p.field!,
            name: matched.name,
            type: matched.type,
            imports: matched.imports,
            description: matched.description,
            jsDocTags: matched.jsDocTags,
          } satisfies IReflectWebSocketOperationParameter.IParam;
        // UNKNOWN TYPE, MAYBE NEW FEATURE
        else {
          if (p.category !== "header")
            errors.push(
              `@WebSocketRoute.${StringUtil.capitalize(p.category)}() has not been supported yet. How about upgrading the nestia packages?`,
            );
          return null;
        }
      })
      .filter((p): p is IReflectWebSocketOperationParameter => !!p);

    const fields: string[] = preconfigured
      .filter((p) => p.category === "param")
      .map((p) => p.field ?? "")
      .filter((field): field is string => !!field?.length)
      .sort();
    for (const cLoc of ctx.controller.paths)
      for (const mLoc of route.paths) {
        const location: string = PathAnalyzer.join(cLoc, mLoc);
        if (location.includes("*")) continue;

        const binded: string[] | null = PathAnalyzer.parameters(location);
        if (binded === null)
          errors.push(`invalid path (${JSON.stringify(location)})`);
        else if (ranges.equal(binded.sort(), fields) === false)
          errors.push(
            `binded arguments in the "path" between function's decorator and parameters' decorators are different (function: [${binded.join(
              ", ",
            )}], parameters: [${fields.join(", ")}]).`,
          );
      }
    if (errors.length) {
      ctx.project.errors.push({
        file: ctx.controller.file,
        class: ctx.controller.class.name,
        function: ctx.function.name,
        from: ctx.name,
        contents: errors,
      });
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
