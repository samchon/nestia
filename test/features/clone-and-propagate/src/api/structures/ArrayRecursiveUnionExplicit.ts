export type ArrayRecursiveUnionExplicit = Array<ArrayRecursiveUnionExplicit.IBucket>;
export namespace ArrayRecursiveUnionExplicit {
    export type IBucket = ArrayRecursiveUnionExplicit.IDirectory | ArrayRecursiveUnionExplicit.IImageFile | ArrayRecursiveUnionExplicit.ITextFile | ArrayRecursiveUnionExplicit.IZipFile | ArrayRecursiveUnionExplicit.IShortcut;
    export type IDirectory = {
        id: number;
        name: string;
        path: string;
        children: Array<ArrayRecursiveUnionExplicit.IBucket>;
        type: ("directory");
    }
    export type IImageFile = {
        id: number;
        name: string;
        path: string;
        width: number;
        height: number;
        url: string;
        size: number;
        type: ("file");
        extension: ("jpg");
    }
    export type ITextFile = {
        id: number;
        name: string;
        path: string;
        size: number;
        content: string;
        type: ("file");
        extension: ("txt");
    }
    export type IZipFile = {
        id: number;
        name: string;
        path: string;
        size: number;
        count: number;
        type: ("file");
        extension: ("zip");
    }
    export type IShortcut = {
        id: number;
        name: string;
        path: string;
        target: ArrayRecursiveUnionExplicit.IBucket;
        type: ("file");
        extension: ("lnk");
    }
}