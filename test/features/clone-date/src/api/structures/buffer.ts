import type { ArrayBufferLike } from "./ArrayBufferLike";

export namespace buffer {
    export namespace global {
        export type Buffer = {
            /**
             * The size in bytes of each element in the array.
             */
            BYTES_PER_ELEMENT: number;
            /**
             * The ArrayBuffer instance referenced by the array.
             */
            buffer: ArrayBufferLike;
            /**
             * The length in bytes of the array.
             */
            byteLength: number;
            /**
             * The offset in bytes of the array.
             */
            byteOffset: number;
            /**
             * The length of the array.
             */
            length: number;
            "__@toStringTag@398": ("Uint8Array");
        } & {
            [key: number]: number;
        }
    }
}