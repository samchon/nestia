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
            if (plugins === undefined)
                return (compilerOptions.plugins = [] as any);
            else if (!Array.isArray(plugins))
                throw new Error(
                    `"plugins" property of ${args.project} must be array type.`,
                );
            return plugins;
        })();

        // CHECK WHETHER CONFIGURED
        const strict: boolean = compilerOptions.strict === true;
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
        if (strict && !!core && !!typia) return;

        // DO CONFIGURE
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
         */
                            "validate": "assert",

        /**
         * Validate JSON typed response body.
         * 
         *   - "assert": Use typia.assertStringify() function
         *   - "is": Use typia.isStringify() function
         *   - "validate": Use typia.validateStringify() function
         *   - "stringify": Use typia.stringify() function, but dangerous
         *   - null: Just use JSON.stringify() function, without boosting
         */
                    "stringify": "assert"
                }`) as comments.CommentObject,
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
