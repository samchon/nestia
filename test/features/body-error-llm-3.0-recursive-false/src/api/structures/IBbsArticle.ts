export namespace IBbsArticle {
  export interface IUpdate {
    title: string;
    content: string;
    nested: Array<IUpdate>;
  }
}
