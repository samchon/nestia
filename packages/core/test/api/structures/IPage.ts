export interface IPage<T extends object> {
    pagination: IPage.IPagination;
    data: T[];
}
export namespace IPage {
    export interface IPagination {
        page: number;
        limit: number;
        total_count: number;
        total_pages: number;
    }
    export interface IRequest {
        page?: number;
        limit?: number;
    }
    export namespace IRequest {
        export type Sort<Literal extends string> = Array<
            `-${Literal}` | `+${Literal}`
        >;
    }
}
