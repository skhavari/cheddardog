import Transaction from './transaction';
import puppeteer from 'puppeteer';

/**
 *
 */
export default interface Account {
    /**
     * A human readable name of the account
     */
    displayName: string;

    /**
     * Fetches recent transactions for this account
     * @param page A puppeteer page that can be used to retreive data
     */
    getTransactions(page: puppeteer.Page): Promise<Transaction[]>;
}
