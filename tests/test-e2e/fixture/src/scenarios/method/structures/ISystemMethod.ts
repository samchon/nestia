/**
 * System Information.
 *
 * @author Jeongho Nam
 */
export interface ISystemMethod {
  /** Random Unique ID. */
  uid: number;

  /** `process.argv` */
  arguments: string[];

  /** Git commit info. */
  commit: ISystemMethod.ICommitMethod;

  /** `package.json` */
  package: ISystemMethod.IPackageMethod;

  /** Creation time of this server. */
  created_at: string;
}

export namespace ISystemMethod {
  /** Git commit info. */
  export interface ICommitMethod {
    shortHash: string;
    branch: string;
    hash: string;
    subject: string;
    sanitizedSubject: string;
    body: string;
    author: ICommitMethod.IUserMethod;
    committer: ICommitMethod.IUserMethod;
    authored_at: string;
    committed_at: string;
    notes?: string;
    tags: string[];
  }
  export namespace ICommitMethod {
    /** Git user account info. */
    export interface IUserMethod {
      name: string;
      email: string;
    }
  }

  /** NPM package info. */
  export interface IPackageMethod {
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
