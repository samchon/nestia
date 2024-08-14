import fs from "fs";
import NodePath from "path";
import { IPointer } from "tstl";

import { INestiaConfig } from "../INestiaConfig";
import { IReflectOperationError } from "../structures/IReflectOperationError";
import { IReflectType } from "../structures/IReflectType";
import { ITypedApplication } from "../structures/ITypedApplication";
import { ITypedHttpRoute } from "../structures/ITypedHttpRoute";
import { CloneGenerator } from "./CloneGenerator";
import { SdkDistributionComposer } from "./internal/SdkDistributionComposer";
import { SdkFileProgrammer } from "./internal/SdkFileProgrammer";

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
    if (app.project.config.clone === true) await CloneGenerator.write(app);

    // FUNCTIONAL
    await SdkFileProgrammer.generate(app);

    // DISTRIBUTION
    if (app.project.config.distribute !== undefined)
      await SdkDistributionComposer.compose({
        config: app.project.config,
        websocket: app.routes.some((r) => r.protocol === "websocket"),
      });
  };

  export const validate = (
    app: ITypedApplication,
  ): IReflectOperationError[] => {
    const errors: IReflectOperationError[] = [];
    if (app.project.config.clone === true) return errors;
    for (const route of app.routes)
      if (route.protocol === "http")
        validateImplicity({
          config: app.project.config,
          errors,
          route,
        });
    return errors;
  };

  const validateImplicity = (props: {
    config: INestiaConfig;
    errors: IReflectOperationError[];
    route: ITypedHttpRoute;
  }): void => {
    for (const p of props.route.parameters) {
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
    if (isImplicitType(props.route.success.type))
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
