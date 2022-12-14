import { IFilesystemFile } from "./IFilesystemFile";

export interface IFilesystemImageFile
    extends IFilesystemFile.IBase<"jpg" | "png" | "gif"> {
    width: number;
    height: number;
    url: string;
}
