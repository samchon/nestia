export interface IDateDefined {
    /**
     * @format date-time
     */
    string: string;

    date: Date;

    /**
     * @format date-time
     */
    date_with_tag: Date;

    date_but_union: Date | Buffer;
}
