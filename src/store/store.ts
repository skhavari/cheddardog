import { Account, Ledger, Transaction, AccountRegistry } from '../account';
import { log } from '../util';
import path from 'path';
import fs from 'fs';
import shell from 'shelljs';

// make sure the output dir exists
shell.mkdir('-p', './out');

// TODO: move serialization into each class via toJSON / fromJSON
const reviver = (
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

const dbFilename = path.join('./out/', 'txndb.json');
const mergeFilename = path.join('./out/', 'txndb.merged.json');

export default class Store {
    static load(): Map<Account, Ledger> {
        let jsonStr = fs.readFileSync(dbFilename, { encoding: 'utf-8' });
        let data = new Map(JSON.parse(jsonStr, reviver));
        return data as Map<Account, Ledger>;
    }

    // updates the store with entries in data.  leaves the rest of the store in tact
    // this retains existing account data when a single account is refreshed.
    // the single account that was refreshed may lose transactions
    static update(data: Map<Account, Ledger>) {
        let curr = Store.load();
        data.forEach((ledger, account) => curr.set(account, ledger));
        Store.save(curr);
    }

    static save(data: Map<Account, Ledger>) {
        log.title('Exporting account list');
        log.start(`saving account data to ${dbFilename}`);
        let stringMap = JSON.stringify([...data]);
        fs.writeFileSync(dbFilename, stringMap);
        log.done(`account data save to ${dbFilename}`);
        log.line('');
    }
}
