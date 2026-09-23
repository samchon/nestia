/** Form of an upload. */
export interface IUploadForm {
  title: string;
  memo?: string;
}

/** Form whose fields are all optional. */
export interface IOptionalForm {
  memo?: string;
}
