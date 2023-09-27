export type ArraySimple = Array<ArraySimple.IPerson>;
export namespace ArraySimple {
    export type IPerson = {
        name: string;
        email: string;
        hobbies: Array<ArraySimple.IHobby>;
    }
    export type IHobby = {
        name: string;
        body: string;
        rank: number;
    }
}