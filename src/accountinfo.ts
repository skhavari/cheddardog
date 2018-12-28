import Transaction from './transaction';

/**
 *  All account information - currently balance and transactions
 */
export default class AccountInfo {
    constructor(
        public balance: number = 0,
        public transactions: Transaction[] = []
    ) {}
}
