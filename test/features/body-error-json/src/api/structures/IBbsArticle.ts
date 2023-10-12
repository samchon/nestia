export namespace IBbsArticle {
    export interface IUpdate {
        sequence: bigint;
        keywords: Set<string>;
        dictionary: Map<string, string>;
        images: Uint8Array[];
        buffer: ArrayBuffer;
        weak: WeakMap<object, string>;
    }
}
