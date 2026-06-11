import { INestiaProject } from "../structures/INestiaProject";
import { IReflectController } from "../structures/IReflectController";
import { IReflectImport } from "../structures/IReflectImport";
import { IReflectMcpOperation } from "../structures/IReflectMcpOperation";
import { IReflectMcpOperationParameter } from "../structures/IReflectMcpOperationParameter";
import { IOperationMetadata } from "../transformers/IOperationMetadata";
import { ImportAnalyzer } from "./ImportAnalyzer";

/**
 * Reflects controller methods carrying `"nestia/McpRoute"` metadata into
 * {@link IReflectMcpOperation} structures consumed by the SDK generator.
 *
 * @author wildduck - https://github.com/wildduck2
 */
export namespace ReflectMcpOperationAnalyzer {
  export interface IProps {
    project: Omit<INestiaProject, "config">;
    controller: IReflectController;
    function: Function;
    name: string;
    metadata: IOperationMetadata;
  }

  export const analyze = (ctx: IProps): IReflectMcpOperation | null => {
    const route:
      | {
          name: string;
          title?: string;
          description?: string;
          inputSchema: object;
          outputSchema?: object;
          annotations?: IReflectMcpOperation.IAnnotations;
        }
      | undefined = Reflect.getMetadata("nestia/McpRoute", ctx.function);
    if (route === undefined) return null;

    const errors: string[] = [];

    const preconfigured: IReflectMcpOperationParameter.IPreconfigured[] = (
      (Reflect.getMetadata(
        "nestia/McpRoute/Parameters",
        ctx.controller.class.prototype,
        ctx.name,
      ) ?? []) as IReflectMcpOperationParameter.IPreconfigured[]
    ).sort((a, b) => a.index - b.index);

    if (preconfigured.length !== 1)
      errors.push(
        "@McpRoute tools must declare exactly one @McpRoute.Params() parameter.",
      );
    if (ctx.metadata.parameters.length !== 1)
      errors.push(
        "@McpRoute tools must have exactly one parameter (the MCP arguments object).",
      );
    else if (preconfigured[0]?.index !== 0)
      errors.push(
        "@McpRoute tools must decorate their only parameter with @McpRoute.Params().",
      );

    const imports: IReflectImport[] = [];
    const parameters: IReflectMcpOperationParameter[] = preconfigured
      .map((p) => {
        const matched: IOperationMetadata.IParameter | undefined =
          ctx.metadata.parameters.find((m) => p.index === m.index);
        if (matched === undefined) {
          errors.push(
            `Unable to find parameter type of the ${p.index} (th) argument.`,
          );
          return null;
        }
        if (matched.type === null) {
          errors.push(
            `Failed to analyze the parameter type of ${JSON.stringify(matched.name)}.`,
          );
          return null;
        }
        imports.push(...matched.imports);
        return {
          category: "params" as const,
          name: matched.name,
          index: p.index,
          type: matched.type,
          imports: matched.imports,
          description: matched.description,
          jsDocTags: matched.jsDocTags,
        };
      })
      .filter((p): p is IReflectMcpOperationParameter => !!p);

    if (ctx.metadata.success?.imports?.length)
      imports.push(...ctx.metadata.success.imports);

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
    // Prefer the decorator's explicit config. Fall back to the JSDoc-derived
    // description captured by SdkOperationTransformer, so users who only
    // document their method with a JSDoc comment still get it surfaced on
    // the `tools/list` wire + the generated SDK metadata.
    return {
      protocol: "mcp",
      name: ctx.name,
      toolName: route.name,
      title: route.title ?? null,
      toolDescription: route.description ?? ctx.metadata.description ?? null,
      inputSchema: route.inputSchema,
      outputSchema: route.outputSchema ?? null,
      annotations: route.annotations ?? null,
      function: ctx.function,
      parameters,
      returnType: ctx.metadata.success?.type ?? null,
      imports: ImportAnalyzer.merge(imports),
      description: ctx.metadata.description ?? null,
      jsDocTags: ctx.metadata.jsDocTags,
    };
  };
}
