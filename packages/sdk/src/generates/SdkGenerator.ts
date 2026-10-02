import fs from "fs";

import { INestiaConfig } from "../INestiaConfig";
import { IReflectOperationError } from "../structures/IReflectOperationError";
import { IReflectType } from "../structures/IReflectType";
import { ITypedApplication } from "../structures/ITypedApplication";
import { ITypedHttpRoute } from "../structures/ITypedHttpRoute";
import { ITypedMcpRoute } from "../structures/ITypedMcpRoute";
import { SDK_BUNDLE_PATH } from "../utils/SdkBundlePath";
import { StringUtil } from "../utils/StringUtil";
import { CloneGenerator } from "./CloneGenerator";
import { SdkDistributionComposer } from "./internal/SdkDistributionComposer";
import { SdkFileProgrammer } from "./internal/SdkFileProgrammer";
import { SdkHttpParameterProgrammer } from "./internal/SdkHttpParameterProgrammer";

/**
 * Generates the SDK library and validates the analyzed routes it needs.
 *
 * @evidence contracts/common.md#principled-implementation The namespace bundles the static files, writes the DTOs and the functions, composes the distribution package, and reports the errors the generation would meet.
 * @evidence contracts/common.md#clear-and-simple-design Two public functions, one public constant, and the private validators.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Validation and generation share the same route model.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
 * @evidence contracts/portability.md#os-neutral-implementation Static bundle enumeration and output creation use Node fs; declaration/module path conversion and distribution process launching are delegated to ImportDictionary and SdkDistributionComposer. Existing file spelling is checked by the filesystem rather than an OS-name case rule.
 */
export namespace SdkGenerator {
  /**
   * Writes the SDK into the configured output directory: the bundled files, the
   * DTOs when `clone` is on, the functions, and the distribution package when
   * `distribute` is set.
   *
   * @evidence contracts/common.md#principled-implementation The steps run in dependency order, the bundle first and the distribution last. An absent output option throws before writing; a configured directory that does not exist is created recursively.
   * @evidence contracts/common.md#clear-and-simple-design One function that delegates each step.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The steps are sequential and each awaits the previous one.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidence contracts/portability.md#os-neutral-implementation Node mkdir and the bundle writer accept the configured native output path; subsequent file and process boundaries belong to their delegated writers. Configuration omission is distinct from a missing on-disk directory.
   */
  export const generate = async (app: ITypedApplication): Promise<void> => {
    if (app.project.config.output === undefined)
      throw new Error("Output directory is not defined.");

    // PREPARE NEW DIRECTORIES
    console.log("Generating SDK Library");
    await fs.promises.mkdir(app.project.config.output, { recursive: true });

    // BUNDLING
    await bundle(app.project.config.output);

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

  /**
   * Returns the errors of routes that cannot become an SDK: MCP tools with
   * duplicate names or accessors, and, without `clone`, HTTP routes whose
   * parameter or return types are implicit, plus implicit exception types when
   * propagation is enabled.
   *
   * @evidence contracts/common.md#principled-implementation The MCP checks always apply, and the implicit return check applies only where the SDK would have to name the type, because `clone` writes it as a declaration instead.
   * @evidence contracts/common.md#clear-and-simple-design One function over three checks.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The list is collected, not thrown, so one run reports every error.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation Validation judges analyzed route types and names and performs no native filesystem or process operation.
   */
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
          function: props.route.key,
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
            function: props.route.key,
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
        function: props.route.key,
        from: "success",
        contents: [`implicit (unnamed) return type.`],
      });
  };

  // Deliberately not `StringUtil.isImplicit`: that one also answers `object`,
  // and this asks a different question -- whether a *return type* is unnamed
  // enough to diagnose. Only the anonymous-marker list is shared, because that
  // is the part that drifts when typia changes how it spells a duplicate.
  const isImplicitType = (type: IReflectType): boolean =>
    StringUtil.isAnonymous(type.name) ||
    type.name.includes("readonly [") ||
    (!!type.typeArguments?.length && type.typeArguments.some(isImplicitType));

  /**
   * Emplace the static bundle files (`index.ts`, `module.ts`, ...) into the SDK
   * output directory.
   *
   * Files the user already has are never touched, so that hand-written
   * customizations (e.g. extra re-exports in `module.ts`) survive regeneration.
   * Only missing files are filled in from the bundle.
   *
   * @evidence contracts/common.md#principled-implementation A file that the user has customized is never overwritten, and only files that are missing are filled in from the bundle.
   * @evidence contracts/common.md#clear-and-simple-design One loop with two guards.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The existing target is checked before the write.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidence contracts/portability.md#os-neutral-implementation fs.readdir/stat enumerate the installed bundle and fs.existsSync checks each target under the filesystem's own policy before writing UTF-8. Forward slash suffixes are accepted by Node on supported native platforms; concurrent generation into the same output is not an exclusive ownership guarantee.
   */
  export const bundle = async (output: string): Promise<void> => {
    const files: string[] = await fs.promises.readdir(BUNDLE_PATH);
    for (const file of files) {
      const current: string = `${BUNDLE_PATH}/${file}`;
      const target: string = `${output}/${file}`;
      const stats: fs.Stats = await fs.promises.stat(current);
      if (stats.isFile() === false) continue;
      if (fs.existsSync(target) === true) continue;

      const content: string = await fs.promises.readFile(current, "utf8");
      await fs.promises.writeFile(target, content, "utf8");
    }
  };

  export const BUNDLE_PATH = SDK_BUNDLE_PATH;
}
