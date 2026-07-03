declare module "react-mui-fileuploader" {
  import type { ComponentType } from "react";

  export interface ExtendedFileProps extends File {
    contentType?: string;
    extension?: string;
    lastModifiedDate?: Date;
    path?: string;
  }

  export interface FileUploadProps {
    acceptedType?: string;
    buttonLabel?: string;
    buttonRemoveLabel?: string;
    defaultFiles?: ExtendedFileProps[];
    getBase64?: boolean;
    header?: string;
    maxUploadFiles?: number;
    multiFile?: boolean;
    onFilesChange?: (files: ExtendedFileProps[]) => void;
    rightLabel?: string;
    title?: string;
  }

  const FileUpload: ComponentType<FileUploadProps>;
  export default FileUpload;
}
