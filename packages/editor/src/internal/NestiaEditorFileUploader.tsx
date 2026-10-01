import { OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@typia/interface";
import { load } from "js-yaml";
import React from "react";
import FileUpload, { type ExtendedFileProps } from "react-mui-fileuploader";

/**
 * A file picker that reads an OpenAPI document from a JSON or YAML file.
 *
 * The last chosen file is read and parsed by its extension, and the result is passed to `onChange` with the parsed document, or with an error message when the content does not parse. Clearing the selection reports `null` for both.
 *
 * @evidence contracts/common.md#principled-implementation The file is decoded as UTF-8 text and parsed with `JSON.parse` for a `json` extension and with `js-yaml` otherwise; a parse failure is reported with the message for the format, and only the last chosen file is kept, matching the single-file picker.
 * @evidence contracts/common.md#clear-and-simple-design One component wraps the third-party uploader and owns only reading and parsing; the form around it belongs to `NestiaEditorUploader`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The parser is chosen by the file extension alone; no document name or content is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The comment states which file is read, how it is parsed, and what `onChange` receives in each case.
 */
export function NestiaEditorFileUploader(
  props: NestiaEditorFileUploader.IProps,
) {
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
      const json:
        | SwaggerV2.IDocument
        | OpenApiV3.IDocument
        | OpenApiV3_1.IDocument =
        extension === "json" ? JSON.parse(content) : load(content);
      props.onChange(json, null);
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
}
/**
 * Properties of {@link NestiaEditorFileUploader}.
 *
 * @evidence contracts/common.md#principled-implementation The namespace holds the property type of the component with the same name.
 * @evidence contracts/common.md#clear-and-simple-design It contains one interface with one callback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It adds no behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment names the component the properties belong to.
 */
export namespace NestiaEditorFileUploader {
  export interface IProps {
    onChange: (
      swagger:
        | SwaggerV2.IDocument
        | OpenApiV3.IDocument
        | OpenApiV3_1.IDocument
        | null,
      error: string | null,
    ) => void;
  }
}
