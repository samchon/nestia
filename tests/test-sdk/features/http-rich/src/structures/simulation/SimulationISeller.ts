/**
 * Seller information.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface SimulationISeller {
  /** Primary key. */
  id: number;

  /** Email address. */
  email: string;

  /** Name of the seller. */
  name: string;

  /** Mobile number of the seller. */
  mobile: string;

  /** Belonged company name. */
  company: string;

  /** Joined time. */
  created_at: string;
}

export namespace SimulationISeller {
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

  export interface IAuthorized extends SimulationISeller {
    authorization: {
      token: string;
      expires_at: string;
    };
  }
}
