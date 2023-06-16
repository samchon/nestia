export interface IDateDefined {
    /**
     * @formt date-time
     */
    string: string;

    date: Date;

    /**
     * @formt date-time
     */
    date_with_tag: Date;

    date_but_union: Date | Buffer;
}