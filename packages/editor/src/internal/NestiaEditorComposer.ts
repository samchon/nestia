import migrate from "@nestia/migrate";
import type { NestiaMigrateApplication } from "@nestia/migrate";
import {
  OpenApiV3,
  OpenApiV3_1,
  OpenApiV3_2,
  SwaggerV2,
} from "@typia/interface";
import * as prettierEsTreePlugin from "prettier/plugins/estree";
import * as prettierTsPlugin from "prettier/plugins/typescript";
import { format } from "prettier/standalone";
import { IValidation } from "typia";

/**
 * Composes the files of a project from an OpenAPI document.
 *
 * It validates and converts the document with `@nestia/migrate`, then formats
 * the TypeScript files with Prettier's standalone build.
 *
 * @evidence contracts/common.md#principled-implementation The composer delegates conversion to `NestiaMigrateApplication`, which owns the OpenAPI semantics, and formats each `.ts` output with Prettier; a file that fails to format keeps its unformatted text.
 * @evidence contracts/common.md#clear-and-simple-design One namespace with two public entry points that differ only in the migration mode, the files to open, and the start script; the shared flow is one private curried function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Conversion and formatting use the public APIs of `@nestia/migrate` and Prettier; a formatting failure is logged and the file is kept as generated.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the composer produces and which libraries do the work.
 */
export namespace NestiaEditorComposer {
  /**
   * Input of the composer: the OpenAPI document, the generator options, and the
   * package name.
   *
   * The internal `files` member bypasses conversion and returns the given files
   * unchanged.
   *
   * @evidence contracts/common.md#principled-implementation The fields are the migrate options the editor exposes plus the document, and `files` lets a caller supply an already composed project.
   * @evidence contracts/common.md#clear-and-simple-design A flat property record; the document type is the union of the supported OpenAPI and Swagger versions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No field is defaulted here; the callers own the defaults.
   * @evidence contracts/common.md#meaningful-documentation The comment states the inputs and the internal member.
   */
  export interface IProps {
    document:
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | OpenApiV3_2.IDocument;
    e2e: boolean;
    keyword: boolean;
    simulate: boolean;
    package?: string;
    /** @internal */
    files?: Record<string, string>;
  }
  /**
   * Output of the composer: the files, the files to open, the start script, and
   * the skipped operations.
   *
   * @evidence contracts/common.md#principled-implementation The record carries what the editor needs to present a composed project, with `skipped` making an incomplete conversion visible.
   * @evidence contracts/common.md#clear-and-simple-design A flat property record without behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Every member is produced by the composer or the migrate application; none is a fixture value.
   * @evidence contracts/common.md#meaningful-documentation The comment names the members and the `skipped` member documents itself.
   */
  export interface IOutput {
    files: Record<string, string>;
    openFile: string;
    startScript: string[];
    /**
     * Operations `@nestia/migrate` could not convert, left out of the files.
     *
     * The CLI prints them; the editor reports them to its user, so a project
     * lacking an operation never passes for a complete one.
     */
    skipped: ISkipped[];
  }
  /**
   * An operation that could not be converted: its upper-case HTTP method, its
   * path, and the reasons.
   *
   * @evidence contracts/common.md#principled-implementation The migrate application reports errors by method, path, and messages, and the composer normalizes the method to upper case for display.
   * @evidence contracts/common.md#clear-and-simple-design Three fields with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The values are copied from the migrate errors.
   * @evidence contracts/common.md#meaningful-documentation The comment states each field.
   */
  export interface ISkipped {
    method: string;
    path: string;
    messages: string[];
  }

  /**
   * Composes a NestJS project from an OpenAPI document.
   *
   * @evidence contracts/common.md#principled-implementation It runs the shared flow with the migrate application's `nest` output, the `README.md,test/start.ts` files to open, and the `build:test,test` start script.
   * @evidence contracts/common.md#clear-and-simple-design A one-expression binding of the shared flow.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The mode is the caller's choice and the constants are the project's own scripts.
   * @evidence contracts/common.md#meaningful-documentation The comment names the project kind produced.
   */
  export const nest = (props: IProps): Promise<IValidation<IOutput>> =>
    compose({
      openFile: "README.md,test/start.ts",
      startScript: ["build:test,test", ""],
      migrate: (app) => app.nest(props),
    })(props);

  /**
   * Composes a software development kit project from an OpenAPI document.
   *
   * @evidence contracts/common.md#principled-implementation It runs the shared flow with the migrate application's `sdk` output, the `README.md,test/start.ts` files to open, and the `swagger` and `hello` start scripts.
   * @evidence contracts/common.md#clear-and-simple-design A one-expression binding of the shared flow.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The mode is the caller's choice and the constants are the project's own scripts.
   * @evidence contracts/common.md#meaningful-documentation The comment names the project kind produced.
   */
  export const sdk = async (props: IProps): Promise<IValidation<IOutput>> =>
    compose({
      openFile: "README.md,test/start.ts",
      startScript: ["swagger", "hello"],
      migrate: (app) => app.sdk(props),
    })(props);

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
            skipped: [],
          },
        };
      const result: IValidation<NestiaMigrateApplication> =
        await migrate.NestiaMigrateApplication.validate(props.document);
      if (result.success === false) return result;

      const app: NestiaMigrateApplication = result.data;
      const files: Record<string, string> = config.migrate(app);
      for (const [key, value] of Object.entries(files))
        if (key.substring(key.length - 3) === ".ts")
          try {
            files[key] = await format(value, {
              parser: "typescript",
              plugins: [prettierEsTreePlugin, prettierTsPlugin],
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
          skipped: app.getData().errors.map((error) => ({
            method: error.method.toUpperCase(),
            path: error.path,
            messages: error.messages,
          })),
        },
      } satisfies IValidation<IOutput>;
    };
}
