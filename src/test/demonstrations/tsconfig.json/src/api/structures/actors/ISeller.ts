export interface ISeller
{
    id: number;
    email: string;
    name: string;
    mobile: string;
    company: string;
}

export namespace ISeller
{
    export interface ILogin
    {
        email: string;
        password: string;
    }

    export interface IJoin
    {
        email: string;
        password: string;
        name: string;
        mobile: string;
        company: string;
    }

    export interface IChangePassword
    {
        old_password: string;
        new_password: string;
    }
}