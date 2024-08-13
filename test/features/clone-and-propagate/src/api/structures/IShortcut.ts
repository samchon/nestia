import type { IDirectory } from "./IDirectory";
import type { IImageFile } from "./IImageFile";
import type { ISharedDirectory } from "./ISharedDirectory";
import type { ITextFile } from "./ITextFile";
import type { IZipFile } from "./IZipFile";

export type IShortcut = {
  id: number;
  name: string;
  path: string;
  target:
    | IDirectory
    | ISharedDirectory
    | IImageFile
    | ITextFile
    | IZipFile
    | IShortcut;
};
