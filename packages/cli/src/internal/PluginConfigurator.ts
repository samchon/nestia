import comments from "comment-json";
import fs from "fs";

import { ArgumentParser } from "./ArgumentParser";

export namespace PluginConfigurator {
  export async function configure(
    args: ArgumentParser.IArguments,
  ): Promise<void> {
    // GET COMPILER-OPTIONS
    const config: comments.CommentObject = comments.parse(
      await fs.promises.readFile(args.project!, "utf8"),
    ) as comments.CommentObject;
    const compilerOptions: comments.CommentObject | undefined =
      config.compilerOptions as comments.CommentObject | undefined;
    if (compilerOptions === undefined)
      throw new Error(
        `${args.project} file does not have "compilerOptions" property.`,
      );

    // PREPARE PLUGINS
    const plugins: comments.CommentArray<comments.CommentObject> | undefined =
      (() => {
      const plugins = compilerOptions.plugins as
        | comments.CommentArray<comments.CommentObject>
        | undefined;
      if (plugins === undefined) return undefined;
      else if (!Array.isArray(plugins))
        throw new Error(
          `"plugins" property of ${args.project} must be array type.`,
        );
      return plugins;
    })();

    // CHECK WHETHER CONFIGURED
    const strict: boolean | undefined = compilerOptions.strict as
      | boolean
      | undefined;
    const strictNullChecks: boolean | undefined =
      compilerOptions.strictNullChecks as boolean | undefined;
    const skipLibCheck: boolean | undefined = compilerOptions.skipLibCheck as
      | boolean
      | undefined;
    const pluginsChanged: boolean = cleanPlugins(compilerOptions, plugins);
    if (
      strictNullChecks !== false &&
      (strict === true || strictNullChecks === true) &&
      skipLibCheck === true &&
      pluginsChanged === false
    )
      return;

    // DO CONFIGURE
    compilerOptions.skipLibCheck = true;
    compilerOptions.strictNullChecks = true;
    if (strict === undefined && strictNullChecks === undefined)
      compilerOptions.strict = true;
    compilerOptions.experimentalDecorators = true;
    compilerOptions.emitDecoratorMetadata = true;

    await fs.promises.writeFile(
      args.project!,
      comments.stringify(config, null, 2),
    );
  }

  const cleanPlugins = (
    compilerOptions: comments.CommentObject,
    plugins: comments.CommentArray<comments.CommentObject> | undefined,
  ): boolean => {
    if (plugins === undefined) return false;
    const retained: comments.CommentObject[] = plugins.filter(
      (plugin) =>
        isTransformPlugin(plugin) === false || hasCustomOption(plugin),
    );
    const changed: boolean = retained.length !== plugins.length;
    if (changed === false) return false;
    plugins.splice(0, plugins.length, ...(retained as any));
    if (plugins.length === 0) delete compilerOptions.plugins;
    return true;
  };

  const isTransformPlugin = (plugin: unknown): plugin is comments.CommentObject =>
    typeof plugin === "object" &&
    plugin !== null &&
    (plugin as comments.CommentObject).transform !== undefined;

  const hasCustomOption = (plugin: comments.CommentObject): boolean =>
    Object.keys(plugin).some(
      (key) =>
        key !== "transform" &&
        key !== "enabled" &&
        (plugin as Record<string, unknown>)[key] !== undefined,
    );
}
