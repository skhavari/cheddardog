import Transaction from './transaction';

/**
 *  A balance and array of transactions for accounts
 */
export default class Ledger {
    constructor(
        public balance: number = 0,
        public transactions: Transaction[] = []
    ) {}
}
