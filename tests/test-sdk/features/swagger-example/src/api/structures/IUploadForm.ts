import { tags } from "typia";

/** Form of an upload. */
export interface IUploadForm {
  title: string;
  memo?: string;
  attachments: File[];
  thumbnail: File | null;
  /** Any of a file or a blob. */
  mixed: Array<File | Blob>;
  maybe: Array<File | null>;
  /** At least one file. */
  cover: File[] & tags.MinItems<1>;
}

/** Form whose fields are all optional. */
export interface IOptionalForm {
  memo?: string;
}
