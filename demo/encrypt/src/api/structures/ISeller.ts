/**
 * Seller information.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface ISeller {
    /**
     * Primary key.
     */
    id: number;

    /**
     * Email address.
     */
    email: string;

    /**
     * Name of the seller.
     */
    name: string;

    /**
     * Mobile number of the seller.
     */
    mobile: string;

    /**
     * Belonged company name.
     */
    company: string;
}

export namespace ISeller {
    export interface ILogin {
        email: string;
        password: string;
    }

    export interface IJoin {
        email: string;
        password: string;
        name: string;
        mobile: string;
        company: string;
    }

    export interface IChangePassword {
        old_password: string;
        new_password: string;
    }
}
