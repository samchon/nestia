/**
 * System Information.
 *
 * @author Jeongho Nam
 */
export interface ISystemParam {
  /** Random Unique ID. */
  uid: number;

  /** `process.argv` */
  arguments: string[];

  /** Git commit info. */
  commit: ISystemParam.ICommitParam;

  /** `package.json` */
  package: ISystemParam.IPackageParam;

  /** Creation time of this server. */
  created_at: string;
}

export namespace ISystemParam {
  /** Git commit info. */
  export interface ICommitParam {
    shortHash: string;
    branch: string;
    hash: string;
    subject: string;
    sanitizedSubject: string;
    body: string;
    author: ICommitParam.IUserParam;
    committer: ICommitParam.IUserParam;
    authored_at: string;
    committed_at: string;
    notes?: string;
    tags: string[];
  }
  export namespace ICommitParam {
    /** Git user account info. */
    export interface IUserParam {
      name: string;
      email: string;
    }
  }

  /** NPM package info. */
  export interface IPackageParam {
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
