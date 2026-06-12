import fs from "fs";
import NodePath from "path";

import { INestiaConfig } from "../INestiaConfig";
import { IReflectOperationError } from "../structures/IReflectOperationError";
import { IReflectType } from "../structures/IReflectType";
import { ITypedApplication } from "../structures/ITypedApplication";
import { ITypedHttpRoute } from "../structures/ITypedHttpRoute";
import { ITypedMcpRoute } from "../structures/ITypedMcpRoute";
import { CloneGenerator } from "./CloneGenerator";
import { SdkDistributionComposer } from "./internal/SdkDistributionComposer";
import { SdkFileProgrammer } from "./internal/SdkFileProgrammer";
import { SdkHttpParameterProgrammer } from "./internal/SdkHttpParameterProgrammer";

export namespace SdkGenerator {
  export const generate = async (app: ITypedApplication): Promise<void> => {
    if (app.project.config.output === undefined)
      throw new Error("Output directory is not defined.");

    // PREPARE NEW DIRECTORIES
    console.log("Generating SDK Library");
    try {
      await fs.promises.mkdir(app.project.config.output);
    } catch {}

    // BUNDLING
    const bundle: string[] = await fs.promises.readdir(BUNDLE_PATH);
    for (const file of bundle) {
      const current: string = `${BUNDLE_PATH}/${file}`;
      const target: string = `${app.project.config.output}/${file}`;
      const stats: fs.Stats = await fs.promises.stat(current);

      if (stats.isFile() === true) {
        const content: string = await fs.promises.readFile(current, "utf8");
        await fs.promises.writeFile(target, content, "utf8");
      }
    }

    // STRUCTURES
    if (app.project.config.clone === true) await CloneGenerator.write(app);

    // FUNCTIONAL
    await SdkFileProgrammer.generate(app);

    // DISTRIBUTION
    if (app.project.config.distribute !== undefined)
      await SdkDistributionComposer.compose({
        config: app.project.config,
        mcp: app.routes.some((r) => r.protocol === "mcp"),
        websocket: app.routes.some((r) => r.protocol === "websocket"),
      });
  };

  export const validate = (
    app: ITypedApplication,
  ): IReflectOperationError[] => {
    const errors: IReflectOperationError[] = [];
    validateMcpDuplicates(errors)(app.routes);
    validateMcpAccessors(errors)(app.routes);
    if (app.project.config.clone === true) return errors;
    for (const route of app.routes)
      if (route.protocol === "http")
        validateImplicit({
          config: app.project.config,
          errors,
          route,
        });
    return errors;
  };

  const validateMcpDuplicates =
    (errors: IReflectOperationError[]) =>
    (routes: ITypedApplication["routes"]): void => {
      const dict: Map<string, ITypedMcpRoute[]> = new Map();
      for (const route of routes)
        if (route.protocol === "mcp") {
          const array = dict.get(route.toolName) ?? [];
          array.push(route);
          dict.set(route.toolName, array);
        }

      for (const [toolName, list] of dict)
        if (list.length > 1)
          for (const route of list)
            errors.push({
              file: route.controller.file,
              class: route.controller.class.name,
              function: route.function.name || route.name,
              from: `@McpRoute(${JSON.stringify(toolName)})`,
              contents: [
                `Duplicate MCP tool name ${JSON.stringify(toolName)} is not allowed.`,
              ],
            });
    };

  const validateMcpAccessors =
    (errors: IReflectOperationError[]) =>
    (routes: ITypedApplication["routes"]): void => {
      const dict: Map<string, ITypedMcpRoute[]> = new Map();
      for (const route of routes)
        if (route.protocol === "mcp") {
          const accessor = route.accessor.join(".");
          const array = dict.get(accessor) ?? [];
          array.push(route);
          dict.set(accessor, array);
        }

      for (const [accessor, list] of dict)
        if (list.length > 1)
          for (const route of list)
            errors.push({
              file: route.controller.file,
              class: route.controller.class.name,
              function: route.function.name || route.name,
              from: `@McpRoute(${JSON.stringify(route.toolName)})`,
              contents: [
                `MCP tool name ${JSON.stringify(route.toolName)} conflicts on generated SDK accessor "api.functional.${accessor}".`,
              ],
            });
    };

  const validateImplicit = (props: {
    config: INestiaConfig;
    errors: IReflectOperationError[];
    route: ITypedHttpRoute;
  }): void => {
    for (const p of SdkHttpParameterProgrammer.getAll(props.route)) {
      if (isImplicitType(p.type))
        props.errors.push({
          file: props.route.controller.file,
          class: props.route.controller.class.name,
          function: props.route.name,
          from: `parameter ${JSON.stringify(p.name)}`,
          contents: [`implicit (unnamed) parameter type.`],
        });
    }
    if (props.config.propagate === true)
      for (const [key, value] of Object.entries(props.route.exceptions))
        if (isImplicitType(value.type))
          props.errors.push({
            file: props.route.controller.file,
            class: props.route.controller.class.name,
            function: props.route.name,
            from: `exception ${JSON.stringify(key)}`,
            contents: [`implicit (unnamed) exception type.`],
          });
    if (
      props.route.success.binary === false &&
      isImplicitType(props.route.success.type)
    )
      props.errors.push({
        file: props.route.controller.file,
        class: props.route.controller.class.name,
        function: props.route.name,
        from: "success",
        contents: [`implicit (unnamed) return type.`],
      });
  };

  const isImplicitType = (type: IReflectType): boolean =>
    type.name === "__type" ||
    type.name === "__object" ||
    type.name.startsWith("__type.") ||
    type.name.startsWith("__object.") ||
    type.name.includes("readonly [") ||
    (!!type.typeArguments?.length && type.typeArguments.some(isImplicitType));

  export const BUNDLE_PATH = NodePath.join(
    __dirname,
    "..",
    "..",
    "assets",
    "bundle",
    "api",
  );
}
