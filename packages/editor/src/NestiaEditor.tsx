import { MigrateApplication } from "@nestia/migrate";
import { OpenApi, OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@samchon/openapi";
import { embedProject } from "@stackblitz/sdk/types/lib";
import React from "react";
import { IValidation } from "typia";

export const ReactEditor = (props: ReactEditor.IProps) => {
  const [id] = React.useState(
    `reactia-editor-div-${Math.random().toString().substring(2)}`,
  );
  React.useEffect(() => {
    (async () => {
      const document:
        | SwaggerV2.IDocument
        | OpenApiV3.IDocument
        | OpenApiV3_1.IDocument
        | OpenApi.IDocument =
        typeof props.swagger === "string"
          ? await getDocument(props.swagger)
          : props.swagger;
      const result: IValidation<MigrateApplication> =
        await MigrateApplication.create(document);
      if (result.success === false) {
        // @todo
        return;
      }

      const app: MigrateApplication = result.data;
      const { files } = app.sdk({
        simulate: !!props.simulate,
        e2e: !!props.e2e,
      });
      embedProject(id, {
        title: document.info?.title ?? "Reactia Editor",
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
      });
    })().catch(() => {});
  }, []);
  return (
    <div
      id={id}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};
export namespace ReactEditor {
  export interface IProps {
    swagger:
      | string
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | OpenApi.IDocument;
    simulate?: boolean;
    e2e?: boolean;

    /**
     * @internal
     */
    files?: Record<string, string>;
  }
}

const getDocument = async (
  url: string,
): Promise<
  | SwaggerV2.IDocument
  | OpenApiV3.IDocument
  | OpenApiV3_1.IDocument
  | OpenApi.IDocument
> => {
  const response: Response = await fetch(url);
  return response.json();
};
