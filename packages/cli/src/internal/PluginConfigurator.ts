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
    const plugins: comments.CommentArray<comments.CommentObject> = (() => {
      const plugins = compilerOptions.plugins as
        | comments.CommentArray<comments.CommentObject>
        | undefined;
      if (plugins === undefined) return (compilerOptions.plugins = [] as any);
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
    const core: comments.CommentObject | undefined = plugins.find(
      (p) =>
        typeof p === "object" &&
        p !== null &&
        p.transform === "@nestia/core/lib/transform",
    );
    const typia: comments.CommentObject | undefined = plugins.find(
      (p) =>
        typeof p === "object" &&
        p !== null &&
        p.transform === "typia/lib/transform",
    );
    const swagger: comments.CommentObject | undefined = plugins.find(
      (p) =>
        typeof p === "object" &&
        p !== null &&
        p.transform === "@nestia/sdk/lib/transform",
    );
    if (
      strictNullChecks !== false &&
      (strict === true || strictNullChecks === true) &&
      core !== undefined &&
      typia !== undefined &&
      swagger !== undefined &&
      skipLibCheck === true
    )
      return;

    // DO CONFIGURE
    compilerOptions.skipLibCheck = true;
    compilerOptions.strictNullChecks = true;
    if (strict === undefined && strictNullChecks === undefined)
      compilerOptions.strict = true;
    compilerOptions.experimentalDecorators = true;
    compilerOptions.emitDecoratorMetadata = true;

    if (core === undefined)
      plugins.push(
        comments.parse(`{
                    "transform": "@nestia/core/lib/transform",
        /**
         * Validate request body.
         * 
         *   - "assert": Use typia.assert() function
         *   - "is": Use typia.is() function
         *   - "validate": Use typia.validate() function
         *   - "assertEquals": Use typia.assertEquals() function
         *   - "equals": Use typia.equals() function
         *   - "validateEquals": Use typia.validateEquals() function
         */
                            "validate": "validate",

        /**
         * Validate JSON typed response body.
         * 
         *   - "assert": Use typia.assertStringify() function
         *   - "is": Use typia.isStringify() function
         *   - "validate": Use typia.validateStringify() function
         *   - "validate.log": typia.validateStringify(), but do not throw and just log it
         *   - "stringify": Use typia.stringify() function, but dangerous
         *   - null: Just use JSON.stringify() function, without boosting
         */
                    "stringify": "assert"
                }`) as comments.CommentObject,
      );
    if (swagger === undefined && args.runtime === true)
      plugins.push(
        comments.parse(
          `{ "transform": "@nestia/sdk/lib/transform" }`,
        ) as comments.CommentObject,
      );
    if (typia === undefined)
      plugins.push(
        comments.parse(
          `{ "transform": "typia/lib/transform" }`,
        ) as comments.CommentObject,
      );
    await fs.promises.writeFile(
      args.project!,
      comments.stringify(config, null, 2),
    );
  }
}
