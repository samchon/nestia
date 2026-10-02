export namespace IUpload {
  export interface IForm {
    title: string;
    description?: string | null;
    file: File;
    previews?: File[];
    flags?: number[];
  }

  export interface IResult {
    title: string;
    description?: string | null;
    count: number;
  }

  export interface IRaw {
    content: string;
    length: number;
  }
}
