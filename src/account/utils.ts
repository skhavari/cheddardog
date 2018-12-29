import Account from './account';
import Transaction from './transaction';
import Ledger from './ledger';
import { DateRange, rangeFromDaysAgo } from '../util';

/**
 * Returns all transactions for all accounts in the map
 * @param data Map fo Accounts to their Ledgers
 */
export const getAllTransactions = (
    data: Map<Account, Ledger>
): Transaction[] => {
    let ledgerToTxns = (ledger: Ledger) => ledger.transactions;
    let sortByDateDesc = (a: Transaction, b: Transaction) => {
        return b.date.getTime() - a.date.getTime();
    };

    let temp: Array<Transaction[]> = Array.from(data.values()).map(
        ledgerToTxns
    );

    let transactions: Transaction[] = ([] as Transaction[]).concat(...temp);
    return transactions.sort(sortByDateDesc);
};

/**
 * a transaction filter function
 */
type txnToBoolFn = (t: Transaction) => boolean;

/**
 * given a date range, returns a filter that returns transactions that satisy the filter
 */
type DateRangeFilterFactory = (r: DateRange) => txnToBoolFn;

/**
 * Given a date range, create a transaction filter function for the given range
 * @param param0 - the date range that transactions must satisfy
 */
let makeRangeFilter: DateRangeFilterFactory = ({ start, end }: DateRange) => {
    return (t: Transaction): boolean => start <= t.date && t.date < end;
};

/**
 * Filters transactions by the ones that have occured since daysAgo param
 *
 * @param transactions List of transactions to filter
 * @param daysAgo Number of days ago
 */
export const getTransactionSinceDaysAgo = (
    transactions: Transaction[],
    daysAgo: number
): Transaction[] => {
    let filterFn = makeRangeFilter(rangeFromDaysAgo(daysAgo));
    return transactions.filter(filterFn);
};
