import Account from './account';
import Transaction from './transaction';
import Ledger from './ledger';
import puppeteer from 'puppeteer';
import fs from 'fs';
import log from './logger';
import AccountRegistry from './accountregistry';

type AccountToLedger = Map<Account, Ledger>;

// TODO: move serialization into each class via toJSON / fromJSON
const customReviver = (
    key: string,
    value: any
): string | Date | Transaction | Ledger | Account => {
    // make dates Dates
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

    if (
        value &&
        typeof value === 'object' &&
        Reflect.has(value, 'balance') &&
        Reflect.has(value, 'transactions')
    ) {
        let { balance, transactions } = value;
        return new Ledger(balance, transactions);
    }

    if (
        value &&
        typeof value === 'object' &&
        Reflect.has(value, 'displayName')
    ) {
        return AccountRegistry.newAccountFromName(value.displayName);
    }

    return value;
};

// TODO: better name and abstraction
export default class AccountList {
    private data: AccountToLedger = new Map<Account, Ledger>();

    public async refreshData(accounts: Account[], page: puppeteer.Page) {
        this.data = new Map<Account, Ledger>();
        for (var account of accounts) {
            this.data.set(account, await account.getLedger(page));
        }
    }

    public get transactions(): Transaction[] {
        let ledgers: Ledger[] = Array.from(this.data.values());
        let temp: Array<Transaction[]> = ledgers.map(
            accountInfo => accountInfo.transactions
        );
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
