import { IMethod } from "./IMethod";

export interface IClass
{
    name: string;
    decorator: string;
    methods: IMethod[];
}

export class SomeClass implements IClass
{
    name: string = "YAHO";
    decorator: string = "SOMETHING";
    methods: IMethod[] = [];
}

new SomeClass();