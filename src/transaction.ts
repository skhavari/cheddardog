export default class Transaction {
    constructor(
        private _date: Date,
        private _description: string,
        private _amount: number
    ) {}

    get date(): Date {
        return this._date;
    }

    get amount(): number {
        return this._amount;
    }
}
