export interface IDateDefined {
  /**
   * @format date-time
   */
  string: string;

  date: Date;

  date_with_tag: Date;

  date_but_union: Date | Buffer;
}
