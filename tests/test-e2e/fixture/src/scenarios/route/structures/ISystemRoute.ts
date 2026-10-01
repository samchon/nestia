/**
 * System Information.
 *
 * @author Jeongho Nam
 */
export interface ISystemRoute {
  /** Random Unique ID. */
  uid: number;

  /** `process.argv` */
  arguments: string[];

  /** Git commit info. */
  commit: ISystemRoute.ICommitRoute;

  /** `package.json` */
  package: ISystemRoute.IPackageRoute;

  /** Creation time of this server. */
  created_at: string;
}

export namespace ISystemRoute {
  /** Git commit info. */
  export interface ICommitRoute {
    shortHash: string;
    branch: string;
    hash: string;
    subject: string;
    sanitizedSubject: string;
    body: string;
    author: ICommitRoute.IUserRoute;
    committer: ICommitRoute.IUserRoute;
    authored_at: string;
    committed_at: string;
    notes?: string;
    tags: string[];
  }
  export namespace ICommitRoute {
    /** Git user account info. */
    export interface IUserRoute {
      name: string;
      email: string;
    }
  }

  /** NPM package info. */
  export interface IPackageRoute {
    name: string;
    version: string;
    description: string;
    main?: string;
    typings?: string;
    scripts: Record<string, string>;
    repository: { type: "git"; url: string };
    author: string;
    license: string;
    bugs: { url: string };
    homepage: string;
    devDependencies?: Record<string, string>;
    dependencies: Record<string, string>;
    publishConfig?: { registry: string };
    files?: string[];
  }
}
