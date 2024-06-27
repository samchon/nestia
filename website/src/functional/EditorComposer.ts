import { MigrateApplication } from "@nestia/migrate";
import { OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@samchon/openapi";
import StackBlitz from "@stackblitz/sdk";
import prettierEsTreePlugin from "prettier/plugins/estree";
import prettierTsPlugin from "prettier/plugins/typescript";
import { format } from "prettier/standalone";
import { IValidation } from "typia";

export namespace EditorComposer {
  export interface IProps {
    title?: string | undefined | null;
    swagger:
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | string;
    e2e: boolean;
    simulate: boolean;
  }

  export const nest = (props: IProps) =>
    compose({
      openFile: "README.md,test/start.ts",
      startScript: ["build:test,test", ""],
      migrate: (app) => app.nest(props),
    })(props);

  export const sdk = (props: IProps) =>
    compose({
      openFile: "README.md,test/start.ts",
      startScript: ["swagger", "hello"],
      migrate: (app) => app.sdk(props),
    })(props);

  const compose =
    (config: {
      openFile: string;
      startScript: string[];
      migrate: (app: MigrateApplication) => MigrateApplication.IOutput;
    }) =>
    async (props: IProps): Promise<void> => {
      const input:
        | SwaggerV2.IDocument
        | OpenApiV3.IDocument
        | OpenApiV3_1.IDocument =
        typeof props.swagger === "string"
          ? await download(props.swagger)
          : props.swagger;
      const result: IValidation<MigrateApplication> =
        await MigrateApplication.create(input);
      if (result.success === false)
        throw new Error(
          "Invalid swagger file (based on OpenAPI 3.0 spec).\n\n" +
            JSON.stringify(result.errors, null, 2),
        );

      const app: MigrateApplication = result.data;
      const { files } = config.migrate(app);
      for (const f of files)
        if (f.file.substring(f.file.length - 3) === ".ts")
          f.content = await format(f.content, {
            parser: "typescript",
            plugins: [prettierEsTreePlugin, prettierTsPlugin],
          });

      StackBlitz.openProject(
        {
          title:
            props.title ?? input.info?.title ?? "TypeScript Swagger Editor",
          template: "node",
          files: Object.fromEntries(
            files.map(
              (f) =>
                [
                  [f.location, f.location.length ? "/" : "", f.file].join(""),
                  f.content,
                ] as const,
            ),
          ),
        },
        {
          newWindow: true,
          openFile: config.openFile,
          startScript: config.startScript as any,
        },
      );
    };

  const download = async (
    url: string,
  ): Promise<
    SwaggerV2.IDocument | OpenApiV3.IDocument | OpenApiV3_1.IDocument
  > => {
    const response: Response = await fetch(url);
    const text: string = await response.text();
    return JSON.parse(text);
  };
}
