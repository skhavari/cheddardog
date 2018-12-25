import Account from './account';
import Transaction from './transaction';
import puppeteer from 'puppeteer';
import fs from 'fs';
import log from './logger';

type AccountToTransactions = Map<Account, Transaction[]>;

const customReviver = (
    key: string,
    value: any
): string | Date | Transaction => {
    if (typeof value === 'string' && key == '_date') {
        return new Date(value);
    }

    if (
        value &&
        typeof value === 'object' &&
        Reflect.has(value, '_date') &&
        Reflect.has(value, '_description') &&
        Reflect.has(value, '_amount')
    ) {
        let { _date, _description, _amount } = value;
        return new Transaction(_date, _description, _amount);
    }
    return value;
};

export default class AccountList {
    private data: AccountToTransactions = new Map<Account, Transaction[]>();

    public async load(accounts: Account[], page: puppeteer.Page) {
        this.data = new Map<Account, Transaction[]>();
        for (var account of accounts) {
            this.data.set(account, await account.getTransactions(page));
        }
    }

    public getTransactions(): Transaction[] {
        let temp: Array<Transaction[]> = [];
        this.data.forEach(transactions => {
            temp.push(transactions);
        });
        return ([] as Transaction[]).concat(...temp);
    }

    public save(filename: string) {
        log.title('Exporting account list');
        log.start(`saving account data to ${filename}`);
        let stringMap = JSON.stringify([...this.data]);
        fs.writeFileSync(filename, stringMap);
        log.done(`account data save to ${filename}`);
        log.line('');
    }

    public static loadFromFile(filename: string): AccountList {
        let jsonStr = fs.readFileSync(filename, { encoding: 'utf-8' });
        let list = new AccountList();
        list.data = new Map(JSON.parse(jsonStr, customReviver));
        return list;
    }
}
