export type StripEnums<T extends Record<string, any>> = {
    [Key in keyof T]: T[Key] extends
        | string
        | boolean
        | object
        | undefined
        | any[]
        ? T[Key]
        : any;
};
