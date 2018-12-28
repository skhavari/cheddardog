import AccountInfo from './accountinfo';
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
    getAccountInfo(page: puppeteer.Page): Promise<AccountInfo>;
}
