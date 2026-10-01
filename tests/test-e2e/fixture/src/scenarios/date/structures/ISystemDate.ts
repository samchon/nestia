/**
 * System Information.
 *
 * @author Jeongho Nam
 */
export interface ISystemDate {
  /** Random Unique ID. */
  uid: number;

  /** `process.argv` */
  arguments: string[];

  /** Git commit info. */
  commit: ISystemDate.ICommitDate;

  /** `package.json` */
  package: ISystemDate.IPackageDate;

  /** Creation time of this server. */
  created_at: string;
}

export namespace ISystemDate {
  /** Git commit info. */
  export interface ICommitDate {
    shortHash: string;
    branch: string;
    hash: string;
    subject: string;
    sanitizedSubject: string;
    body: string;
    author: ICommitDate.IUserDate;
    committer: ICommitDate.IUserDate;
    authored_at: string;
    committed_at: string;
    notes?: string;
    tags: string[];
  }
  export namespace ICommitDate {
    /** Git user account info. */
    export interface IUserDate {
      name: string;
      email: string;
    }
  }

  /** NPM package info. */
  export interface IPackageDate {
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
