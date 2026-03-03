export type ITextFile = {
  id: number;
  name: string;
  path: string;
  size: number;
  content: string;
  type: "file";
  extension: "txt";
};
export namespace ITextFile {
  export type o1 = {
    id: number;
    name: string;
    path: string;
    size: number;
    content: string;
  };
}
