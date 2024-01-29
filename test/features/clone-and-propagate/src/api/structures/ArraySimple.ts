export type ArraySimple = ArraySimple.IPerson[];
export namespace ArraySimple {
  export type IPerson = {
    name: string;
    email: string;
    hobbies: ArraySimple.IHobby[];
  };
  export type IHobby = {
    name: string;
    body: string;
    rank: number;
  };
}
