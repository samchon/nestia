/**
 * System Information.
 *
 * @author Jeongho Nam
 */
export interface ISystemHeaders {
  /** Random Unique ID. */
  uid: number;

  /** `process.argv` */
  arguments: string[];

  /** Git commit info. */
  commit: ISystemHeaders.ICommitHeaders;

  /** `package.json` */
  package: ISystemHeaders.IPackageHeaders;

  /** Creation time of this server. */
  created_at: string;
}

export namespace ISystemHeaders {
  /** Git commit info. */
  export interface ICommitHeaders {
    shortHash: string;
    branch: string;
    hash: string;
    subject: string;
    sanitizedSubject: string;
    body: string;
    author: ICommitHeaders.IUserHeaders;
    committer: ICommitHeaders.IUserHeaders;
    authored_at: string;
    committed_at: string;
    notes?: string;
    tags: string[];
  }
  export namespace ICommitHeaders {
    /** Git user account info. */
    export interface IUserHeaders {
      name: string;
      email: string;
    }
  }

  /** NPM package info. */
  export interface IPackageHeaders {
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
