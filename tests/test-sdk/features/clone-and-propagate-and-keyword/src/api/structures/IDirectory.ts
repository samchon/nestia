import type { IImageFile } from "./IImageFile";
import type { ISharedDirectory } from "./ISharedDirectory";
import type { IShortcut } from "./IShortcut";
import type { ITextFile } from "./ITextFile";
import type { IZipFile } from "./IZipFile";

export type IDirectory = {
  id: number;
  name: string;
  path: string;
  children: (IDirectory | IImageFile | ITextFile | IZipFile | IShortcut)[];
  type: "directory";
};
export namespace IDirectory {
  export type o1 = {
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
}
