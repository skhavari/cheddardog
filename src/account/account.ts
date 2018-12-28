import Ledger from './ledger';
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
     * Fetches recent balance and transactions for this account
     * @param page A puppeteer page that can be used to retreive data
     */
    getLedger(page: puppeteer.Page): Promise<Ledger>;
}
