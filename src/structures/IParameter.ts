import { IVariable } from "./IVariable";

export interface IParameter extends IVariable
{
    decorator: string;
}