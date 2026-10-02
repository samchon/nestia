// Module augmentation: typia v13's `IReference` carries only a symbolic
// `name` + tags, but `MetadataSchema.from(plain, dictionary)` mutates
// each reference to also hold the resolved target type so downstream
// sdk code can keep its `ref.type!.value` / `ref.type!.elements` access
// pattern from the legacy `@typia/core` `MetadataArray` / `MetadataTuple`
// classes. The field is optional because it is only populated after a
// `MetadataSchema.from` walk against a dictionary.
export {};

declare module "@typia/interface" {
  namespace IMetadataSchema {
    interface IReference {
      type?: IArrayType | ITupleType | IObjectType | IAliasType;
    }
  }
}
