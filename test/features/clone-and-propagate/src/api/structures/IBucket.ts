import type { IDirectory } from "./IDirectory";
import type { IImageFile } from "./IImageFile";
import type { ISharedDirectory } from "./ISharedDirectory";
import type { IShortcut } from "./IShortcut";
import type { ITextFile } from "./ITextFile";
import type { IZipFile } from "./IZipFile";

export type IBucket =
  | IDirectory
  | IImageFile
  | ITextFile
  | IZipFile
  | IShortcut;
export namespace IBucket {
  export type o1 =
    | IDirectory.o1
    | ISharedDirectory
    | IImageFile.o1
    | ITextFile.o1
    | IZipFile.o1
    | IShortcut.o1;
}
