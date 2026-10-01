export interface ISegmentEcho {
  values: string[];
}
export namespace ISegmentEcho {
  export interface IProvider {
    get(): ISegmentEcho;
  }
}
