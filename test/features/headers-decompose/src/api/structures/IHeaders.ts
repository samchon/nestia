export interface IHeaders {
    "x-category": "x" | "y" | "z";
    "x-memo"?: string;

    /**
     * @default Samchon
     */
    "x-name"?: string;
    "x-values": number[];
    "x-flags": boolean[];

    /**
     * @hidden
     */
    "X-descriptions": string[];
}
