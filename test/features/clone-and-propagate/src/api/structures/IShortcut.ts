import type { IDirectory } from "./IDirectory";
import type { IImageFile } from "./IImageFile";
import type { ISharedDirectory } from "./ISharedDirectory";
import type { ITextFile } from "./ITextFile";
import type { IZipFile } from "./IZipFile";

export type IShortcut = {
  id: number;
  name: string;
  path: string;
  target: IDirectory | IImageFile | ITextFile | IZipFile | IShortcut;
  type: "file";
  extension: "lnk";
};
export namespace IShortcut {
  export type o1 = {
    id: number;
    name: string;
    path: string;
    target:
      | IDirectory.o1
      | ISharedDirectory
      | IImageFile.o1
      | ITextFile.o1
      | IZipFile.o1
      | IShortcut.o1;
  };
}
