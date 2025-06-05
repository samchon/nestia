import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@samchon/openapi";
import * as jsDoc from "prettier-plugin-jsdoc";
import * as prettierEsTreePlugin from "prettier/plugins/estree";
import * as prettierTsPlugin from "prettier/plugins/typescript";
import { format } from "prettier/standalone";
import { IValidation } from "typia";

export namespace NestiaEditorComposer {
  export interface IProps {
    document: SwaggerV2.IDocument | OpenApiV3.IDocument | OpenApiV3_1.IDocument;
    e2e: boolean;
    keyword: boolean;
    simulate: boolean;
    package?: string;
    /** @internal */
    files?: Record<string, string>;
  }
  export interface IOutput {
    files: Record<string, string>;
    openFile: string;
    startScript: string[];
  }

  export const nest = (props: IProps): Promise<IValidation<IOutput>> =>
    compose({
      openFile: "README.md,test/start.ts",
      startScript: ["build:test,test", ""],
      migrate: (app) => app.nest(props),
    })(props);

  export const sdk = async (props: IProps): Promise<IValidation<IOutput>> => {
    console.log("NestiaEditorComposer.sdk()", props);
    return compose({
      openFile: "README.md,test/start.ts",
      startScript: ["swagger", "hello"],
      migrate: (app) => app.sdk(props),
    })(props);
  };

  const compose =
    (config: {
      openFile: string;
      startScript: string[];
      migrate: (app: NestiaMigrateApplication) => Record<string, string>;
    }) =>
    async (props: IProps): Promise<IValidation<IOutput>> => {
      if (props.files !== undefined)
        return {
          success: true,
          data: {
            files: props.files,
            openFile: config.openFile,
            startScript: config.startScript,
          },
        };
      const result: IValidation<NestiaMigrateApplication> =
        await NestiaMigrateApplication.validate(props.document);
      if (result.success === false) return result;

      const app: NestiaMigrateApplication = result.data;
      const files: Record<string, string> = config.migrate(app);
      for (const [key, value] of Object.entries(files))
        if (key.substring(key.length - 3) === ".ts")
          try {
            files[key] = await format(value, {
              parser: "typescript",
              plugins: [prettierEsTreePlugin, prettierTsPlugin, jsDoc],
            });
          } catch (exp) {
            console.log(exp);
          }
      return {
        success: true,
        data: {
          files,
          openFile: config.openFile,
          startScript: config.startScript,
        },
      } satisfies IValidation<IOutput>;
    };
}
