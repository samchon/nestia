import { ISwagger } from "@nestia/migrate";
import { load } from "js-yaml";
import { useState } from "react";
import FileUpload from "react-mui-fileuploader";
import { ExtendedFileProps } from "react-mui-fileuploader/dist/types/index.types";

const EditorUploader = (props: {
  onChange: (swagger: ISwagger | null, error: string | null) => void;
}) => {
  const [elements, setElements] = useState<ExtendedFileProps[]>([]);

  const onChange = async (array: ExtendedFileProps[]) => {
    if (array.length === 0) {
      props.onChange(null, null);
      return;
    }

    const file: ExtendedFileProps = array.at(-1)!;
    const buffer: ArrayBuffer = await file.arrayBuffer();
    const content: string = new TextDecoder().decode(buffer);
    const extension: "json" | "yaml" = file.name.split(".").pop()! as
      | "json"
      | "yaml";

    try {
      const json: ISwagger =
        extension === "json" ? JSON.parse(content) : load(content);
      props.onChange(json, null);
    } catch {
      props.onChange(
        null,
        extension === "json" ? "Invalid JSON file" : "Invalid YAML file",
      );
      return;
    }
    if (array.length > 1) {
      setElements([file]);
    }
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
export default EditorUploader;
