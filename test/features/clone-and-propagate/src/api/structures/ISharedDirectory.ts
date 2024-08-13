import type { IDirectory } from "./IDirectory";
import type { IImageFile } from "./IImageFile";
import type { IShortcut } from "./IShortcut";
import type { ITextFile } from "./ITextFile";
import type { IZipFile } from "./IZipFile";

export type ISharedDirectory = {
  access: "read" | "write";
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
