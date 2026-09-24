export interface IShadow {
  value: string;
}
export namespace IShadow {
  export interface IOptional {
    value?: string;
  }
  export interface IHeaders extends IShadow {
    headers: {
      "x-shadow": string;
    };
  }
}
