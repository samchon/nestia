export interface PropagationIForbidden {
  status: 403;
  message: string;
}
export namespace PropagationIForbidden {
  export interface IExpired {
    status: 422;
    message: string;
  }
}
