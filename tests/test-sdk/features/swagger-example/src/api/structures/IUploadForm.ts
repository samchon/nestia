/** Form of an upload. */
export interface IUploadForm {
  title: string;
  memo?: string;
  attachments: File[];
  thumbnail: File | null;
}

/** Form whose fields are all optional. */
export interface IOptionalForm {
  memo?: string;
}
