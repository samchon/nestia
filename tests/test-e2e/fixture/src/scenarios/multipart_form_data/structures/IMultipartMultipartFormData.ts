export interface IMultipartMultipartFormData {
  title: string;
  blob: Blob;
  blobs: Blob[];
  description: null | string;
  file: File;
  flags: number[];
  files: File[];
  notes?: string[];
}
export namespace IMultipartMultipartFormData {
  export interface IContentMultipartFormData {
    title: string;
    description: null | string;
    flags: number[];
    notes?: string[];
    uploads: {
      blob: number[];
      blobs: number[][];
      file: IFileContent;
      files: IFileContent[];
    };
  }

  export interface IFileContent {
    name: string;
    bytes: number[];
  }

  export interface IDiskMultipartFormData {
    file: File;
  }

  export interface IDiskContentMultipartFormData {
    name: string;
    size: number;
    text: string;
  }
}
