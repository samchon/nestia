export type ArrayRecursiveUnionImplicit = Array<ArrayRecursiveUnionImplicit.IBucket>;
export namespace ArrayRecursiveUnionImplicit {
    export type IBucket = ArrayRecursiveUnionImplicit.IDirectory | ArrayRecursiveUnionImplicit.ISharedDirectory | ArrayRecursiveUnionImplicit.IImageFile | ArrayRecursiveUnionImplicit.ITextFile | ArrayRecursiveUnionImplicit.IZipFile | ArrayRecursiveUnionImplicit.IShortcut;
    export type IDirectory = {
        id: number;
        name: string;
        path: string;
        children: Array<ArrayRecursiveUnionImplicit.IBucket>;
    }
    export type ISharedDirectory = {
        access: ("read" | "write");
        id: number;
        name: string;
        path: string;
        children: Array<ArrayRecursiveUnionImplicit.IBucket>;
    }
    export type IImageFile = {
        id: number;
        name: string;
        path: string;
        width: number;
        height: number;
        url: string;
        size: number;
    }
    export type ITextFile = {
        id: number;
        name: string;
        path: string;
        size: number;
        content: string;
    }
    export type IZipFile = {
        id: number;
        name: string;
        path: string;
        size: number;
        count: number;
    }
    export type IShortcut = {
        id: number;
        name: string;
        path: string;
        target: ArrayRecursiveUnionImplicit.IBucket;
    }
}