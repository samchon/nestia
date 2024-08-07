import fs from "fs";
import NodePath from "path";
import path from "path";
import { IPointer } from "tstl";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";

import { INestiaProject } from "../structures/INestiaProject";
import { ISwaggerError } from "../structures/ISwaggerError";
import { ITypedHttpRoute } from "../structures/ITypedHttpRoute";
import { ITypedWebSocketRoute } from "../structures/ITypedWebSocketRoute";
import { CloneGenerator } from "./CloneGenerator";
import { SwaggerGenerator } from "./SwaggerGenerator";
import { SdkDistributionComposer } from "./internal/SdkDistributionComposer";
import { SdkFileProgrammer } from "./internal/SdkFileProgrammer";

export namespace SdkGenerator {
  export const generate =
    (project: INestiaProject) =>
    async (
      routes: Array<ITypedHttpRoute | ITypedWebSocketRoute>,
    ): Promise<void> => {
      console.log("Generating SDK Library");

      // VALIDATE THROUGH SWAGGER GENERATOR
      const errors: ISwaggerError[] = [];
      const validate = SwaggerGenerator.generate_route({
        config: { output: "" },
        checker: project.checker,
        collection: new MetadataCollection({
          replace: MetadataCollection.replace,
        }),
        lazyProperties: [],
        lazySchemas: [],
        errors,
        swagger: await SwaggerGenerator.initialize(
          project.config.swagger ?? { output: "" },
        ),
      });
      for (const r of routes)
        if (r.protocol === "http") {
          validate(r);
          if (project.config.clone !== true) validateImplicity(project)(r);
        }
      if (errors.length) {
        for (const e of errors)
          console.error(
            `${path.relative(process.cwd(), e.route.location)}:${
              e.route.controller.name
            }.${e.route.name}:${
              e.from
            } - error TS(@nestia/sdk): invalid type detected.\n\n` +
              e.messages.map((m) => `  - ${m}`).join("\n"),
            "\n\n",
          );
        throw new TypeError("Invalid type detected");
      } else if (project.errors.length) {
        for (const e of project.errors)
          console.error(
            `${path.relative(process.cwd(), e.file)}:${
              e.controller
            }.${e.function}: error TS(@nestia/sdk): ${e.message}`,
          );
        throw new TypeError("Invalid type detected");
      }

      // PREPARE NEW DIRECTORIES
      try {
        await fs.promises.mkdir(project.config.output!);
      } catch {}

      // BUNDLING
      const bundle: string[] = await fs.promises.readdir(BUNDLE_PATH);
      for (const file of bundle) {
        const current: string = `${BUNDLE_PATH}/${file}`;
        const target: string = `${project.config.output}/${file}`;
        const stats: fs.Stats = await fs.promises.stat(current);

        if (stats.isFile() === true) {
          const content: string = await fs.promises.readFile(current, "utf8");
          if (fs.existsSync(target) === false)
            await fs.promises.writeFile(target, content, "utf8");
          else if (BUNDLE_CHANGES[file] !== undefined) {
            const r: IPointer<string> = {
              value: await fs.promises.readFile(target, "utf8"),
            };
            for (const [before, after] of BUNDLE_CHANGES[file])
              r.value = r.value.replace(before, after);
            await fs.promises.writeFile(target, r.value, "utf8");
          }
        }
      }

      // STRUCTURES
      if (project.config.clone)
        await CloneGenerator.write(project)(
          routes.filter((r) => r.protocol === "http") as ITypedHttpRoute[],
        );

      // FUNCTIONAL
      await SdkFileProgrammer.generate(project)(routes);

      // DISTRIBUTION
      if (project.config.distribute !== undefined)
        await SdkDistributionComposer.compose(
          project.config,
          routes.some((r) => r.protocol === "websocket"),
        );
    };

  const validateImplicity =
    (project: INestiaProject) =>
    (route: ITypedHttpRoute): void => {
      for (const p of route.parameters) {
        if (isImplicitType(p.typeName))
          project.errors.push({
            file: route.location,
            controller: route.controller.name,
            function: route.name,
            message: `implicit (unnamed) parameter type from "${route.name}@${p.name}".`,
          });
      }
      if (project.config.propagate !== true)
        for (const [key, value] of Object.entries(route.exceptions))
          if (isImplicitType(value.typeName))
            project.errors.push({
              file: route.location,
              controller: route.controller.name,
              function: route.name,
              message: `implicit (unnamed) exception type of ${key} status from "${route.name}".`,
            });
      if (isImplicitType(route.output.typeName))
        project.errors.push({
          file: route.location,
          controller: route.controller.name,
          function: route.name,
          message: `implicit (unnamed) return type from "${route.name}".`,
        });
    };

  const isImplicitType = (typeName: string): boolean =>
    typeName === "__type" ||
    typeName === "__object" ||
    typeName.startsWith("__type.") ||
    typeName.startsWith("__object.") ||
    typeName.includes("readonly [");

  export const BUNDLE_PATH = NodePath.join(
    __dirname,
    "..",
    "..",
    "assets",
    "bundle",
    "api",
  );
}

const BUNDLE_CHANGES: Record<string, [string, string][]> = {
  "IConnection.ts": [
    [
      `export { IConnection } from "@nestia/fetcher"`,
      `export type { IConnection } from "@nestia/fetcher"`,
    ],
  ],
  "module.ts": [
    [`export * from "./IConnection"`, `export type * from "./IConnection"`],
    [`export * from "./Primitive"`, `export type * from "./Primitive"`],
  ],
  "Primitive.ts": [
    [
      `export { Primitive } from "@nestia/fetcher"`,
      `export type { Primitive } from "@nestia/fetcher"`,
    ],
  ],
};
