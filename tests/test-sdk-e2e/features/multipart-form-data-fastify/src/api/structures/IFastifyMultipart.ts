export interface IFastifyMultipart {
  title: string;
  file: File;
  files: File[];
}
export namespace IFastifyMultipart {
  export interface IContent {
    title: string;
    file: IFile;
    files: IFile[];
  }
  export interface IFile {
    name: string;
    text: string;
  }
}
