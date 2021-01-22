import { IParameter } from "./IParameter";

export interface IMethod
{
    name: string;
    decorator: string;
    parameters: IParameter[];
    output: string;
}