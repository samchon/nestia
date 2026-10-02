export interface IMultipart {
  title: string;
  blob: Blob;
  blobs: Blob[];
  description: null | string;
  file: File;
  flags: number[];
  files: File[];
  notes?: string[];
}
export namespace IMultipart {
  export interface IContent {
    title: string;
    description: null | string;
    flags: number[];
    notes?: string[];
  }

  export interface IDisk {
    file: File;
  }

  export interface IDiskContent {
    name: string;
    size: number;
    text: string;
  }
}
