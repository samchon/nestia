export interface IMetadata
{
    atomics: Set<string>;
    arraies: Map<string, IMetadata|null>;
    objects: Set<string>;
    nullable: boolean;
    required: boolean;
    description?: string;
}
export namespace IMetadata
{
    export interface IObject
    {
        description: string;
        properties: Record<string, IMetadata | null>;
        nullable: boolean;
    }

    export interface IApplication
    {
        metadata: IMetadata;
        storage: IStorage;
    }
    export type IStorage = Record<string, IMetadata.IObject>;
}