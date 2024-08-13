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
    | IDirectory.o1
    | ISharedDirectory
    | IImageFile.o1
    | ITextFile.o1
    | IZipFile.o1
    | IShortcut.o1
  )[];
};
