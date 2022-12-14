import { IFilesystemFile } from "./IFilesystemFile";

export interface IFilesystemTextFile
    extends IFilesystemFile.IBase<"txt" | "md" | "ts"> {
    content: string;
}
