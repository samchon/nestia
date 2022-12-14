import { IFilesystemFile } from "./IFilesystemFile";

export interface IFilesystemZipFile extends IFilesystemFile.IBase<"zip"> {
    count: number;
}
