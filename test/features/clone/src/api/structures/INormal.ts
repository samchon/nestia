export type INormal = {
    type: ("normal");
    id: string;
    name: string;
    created_at: string;
    other_attr: boolean;
}
export namespace INormal {
    export type IPublicProfile = {
        type: ("normal");
        id: string;
        name: string;
    }
}