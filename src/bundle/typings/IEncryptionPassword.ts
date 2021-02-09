export interface IEncyptionPassword
{
    key: string;
    iv: string | ((str: string) => string);
}