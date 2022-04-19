import * as tsc from "typescript";

export interface IConfiguration
{
    input: string | string[] | IConfiguration.IInput;
    output: string;
    compilerOptions?: tsc.CompilerOptions;
    assert?: boolean;
    json?: boolean;
}
export namespace IConfiguration
{
    export interface IInput
    {
        include: string[];
        exclude?: string[];
    }
}