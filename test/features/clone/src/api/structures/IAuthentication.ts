export namespace IAuthentication {
    export type OuathType = ("kakao" | "github");
    export type IQuery = {
        oauth: IAuthentication.OuathType;
    }
}