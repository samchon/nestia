import { createHttpLlmApplication } from "@nestia/agent";
import { OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@samchon/openapi";
import { IHttpLlmApplication } from "@samchon/openapi";
import { load } from "js-yaml";
import React from "react";
// @ts-ignore
import FileUpload from "react-mui-fileuploader";
// @ts-ignore
import { ExtendedFileProps } from "react-mui-fileuploader/dist/types/index.types";
import { IValidation } from "typia";

export const NestiaChatPlaygroundFileUploadMovie = (
  props: NestiaChatPlaygroundFileUploadMovie.IProps,
) => {
  const [elements, setElements] = React.useState<ExtendedFileProps[]>([]);
  const onChange = async (array: ExtendedFileProps[]) => {
    if (array.length === 0) {
      props.onChange(null, null);
      return;
    }

    const file: ExtendedFileProps = array[array.length - 1]!;
    const buffer: ArrayBuffer = await file.arrayBuffer();
    const content: string = new TextDecoder().decode(buffer);
    const extension: "json" | "yaml" = file.name.split(".").pop()! as
      | "json"
      | "yaml";

    try {
      const document:
        | SwaggerV2.IDocument
        | OpenApiV3.IDocument
        | OpenApiV3_1.IDocument =
        extension === "json" ? JSON.parse(content) : load(content);
      const application: IValidation<IHttpLlmApplication<"chatgpt">> =
        createHttpLlmApplication({
          model: "chatgpt",
          document,
          options: {
            reference: true,
          },
        });
      if (application.success === true) props.onChange(application.data, null);
      else props.onChange(null, JSON.stringify(application.errors, null, 2));
    } catch {
      props.onChange(
        null,
        extension === "json" ? "Invalid JSON file" : "Invalid YAML file",
      );
      return;
    }
    if (array.length > 1) setElements([file]);
  };
  return (
    <FileUpload
      defaultFiles={elements}
      onFilesChange={onChange}
      acceptedType=".json, .yaml"
      getBase64={false}
      multiFile={false}
      maxUploadFiles={1}
      title="Swagger file uploader"
      header="Drag and drop a Swagger file here"
      buttonLabel="Click Here"
      rightLabel="to select swagger.json/yaml file"
      buttonRemoveLabel="Clear"
    />
  );
};
export namespace NestiaChatPlaygroundFileUploadMovie {
  export interface IProps {
    onChange: (
      application: IHttpLlmApplication<"chatgpt"> | null,
      error: string | null,
    ) => void;
  }
}
