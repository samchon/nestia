import { MigrateApplication } from "@nestia/migrate";
import { OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@samchon/openapi";
import * as prettierEsTreePlugin from "prettier/plugins/estree";
import * as prettierTsPlugin from "prettier/plugins/typescript";
import { format } from "prettier/standalone";
import { IValidation } from "typia";

export namespace NestiaEditorComposer {
  export interface IProps {
    document: SwaggerV2.IDocument | OpenApiV3.IDocument | OpenApiV3_1.IDocument;
    e2e: boolean;
    simulate: boolean;
    package?: string;
    /**
     * @internal
     */
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
      migrate: (app: MigrateApplication) => MigrateApplication.IOutput;
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
      const result: IValidation<MigrateApplication> =
        await MigrateApplication.create(props.document);
      if (result.success === false) return result;

      const app: MigrateApplication = result.data;
      const { files } = config.migrate(app);
      for (const f of files)
        if (f.file.substring(f.file.length - 3) === ".ts")
          try {
            f.content = await format(f.content, {
              parser: "typescript",
              plugins: [prettierEsTreePlugin, prettierTsPlugin],
            });
          } catch (exp) {
            console.log(exp);
          }
      return {
        success: true,
        data: {
          files: Object.fromEntries(
            files.map(
              (f) =>
                [
                  [f.location, f.location.length ? "/" : "", f.file].join(""),
                  f.content,
                ] as const,
            ),
          ),
          openFile: config.openFile,
          startScript: config.startScript,
        },
      } satisfies IValidation<IOutput>;
    };
}
