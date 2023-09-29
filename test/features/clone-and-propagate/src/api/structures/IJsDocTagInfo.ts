export type IJsDocTagInfo = {
    name: string;
    text?: Array<IJsDocTagInfo.IText>;
}
export namespace IJsDocTagInfo {
    export type IText = {
        text: string;
        kind: string;
    }
}