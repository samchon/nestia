export interface IMultipart {
  title: string;
  blob: Blob;
  blobs: Blob[];
  description: null | string;
  file: File;
  files: File[];
  notes?: string[];
}
