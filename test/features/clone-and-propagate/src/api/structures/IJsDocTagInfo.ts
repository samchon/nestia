export type IJsDocTagInfo = {
  name: string;
  text?: undefined | IJsDocTagInfo.IText[];
};
export namespace IJsDocTagInfo {
  export type IText = {
    text: string;
    kind: string;
  };
}
