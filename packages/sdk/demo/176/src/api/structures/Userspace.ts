export namespace Userspace {
    interface User {
        id: string;
        name: string;
    }

    export type UserType1 = Pick<User, "id">;
    export type UserType2 = Pick<User, "id"> & Pick<User, "name">;
}
