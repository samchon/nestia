export interface IQuery {
    limit?: number;
    enforce: boolean;
    values: string[];
    atomic: string | null;
}
