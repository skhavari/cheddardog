import Account from './account';
import Transaction from './transaction';
import puppeteer from 'puppeteer';
import fs from 'fs';
import { logTitle, logStart, logDone } from './logger';

type AccountToTransactions = Map<Account, Transaction[]>;

export default class AccountList {
    private data: AccountToTransactions = new Map<Account, Transaction[]>();

    public async load(accounts: Account[], page: puppeteer.Page) {
        this.data = new Map<Account, Transaction[]>();
        for (var account of accounts) {
            this.data.set(account, await account.getTransactions(page));
        }
    }

    public save(filename: string) {
        logTitle('Exporting account list');
        logStart(`saving account data to ${filename}`);
        let stringMap = JSON.stringify([...this.data]);
        fs.writeFileSync(filename, stringMap);
        logDone(`account data save to ${filename}`);
    }

    public static loadFromFile(filename: string): AccountList {
        let list = new AccountList();
        // hydrate from file
        return list;
    }
}
