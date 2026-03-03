export type IZipFile = {
  id: number;
  name: string;
  path: string;
  size: number;
  count: number;
  type: "file";
  extension: "zip";
};
export namespace IZipFile {
  export type o1 = {
    id: number;
    name: string;
    path: string;
    size: number;
    count: number;
  };
}
