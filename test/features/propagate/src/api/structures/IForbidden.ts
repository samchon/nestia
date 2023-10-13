export interface IForbidden {
    status: 403;
    message: string;
}
export namespace IForbidden {
    export interface IExpired {
        status: 422;
        message: string;
    }
}
