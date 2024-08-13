import type { IImageFile } from "./IImageFile";
import type { ISharedDirectory } from "./ISharedDirectory";
import type { IShortcut } from "./IShortcut";
import type { ITextFile } from "./ITextFile";
import type { IZipFile } from "./IZipFile";

export type IDirectory = {
  id: number;
  name: string;
  path: string;
  children: (
    | IDirectory
    | ISharedDirectory
    | IImageFile
    | ITextFile
    | IZipFile
    | IShortcut
  )[];
};
