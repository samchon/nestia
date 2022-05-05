import ts from "typescript";

export interface IType
{
    metadata: ts.Type;
    escapedText: string;
}