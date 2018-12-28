import { Account, Ledger } from '../account';
import { BrowserUtil } from '../util';

export default class Refresher {
    static async refresh(accounts: Account[]): Promise<Map<Account, Ledger>> {
        let browser = await BrowserUtil.newBrowser();
        let page = await BrowserUtil.newPage(browser);
        let data = new Map<Account, Ledger>();
        for (var account of accounts) {
            data.set(account, await account.getLedger(page));
        }

        await browser.close();
        return data;
    }
}
