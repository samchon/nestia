export interface IHeaders {
    "x-category": "x" | "y" | "z";
    "x-memo"?: string;

    /**
     * @default Samchon
     */
    "x-nAme"?: string;
    "x-values": number[];
    "x-fLags": boolean[];

    /**
     * @hidden
     */
    "X-Descriptions": string[];
}
