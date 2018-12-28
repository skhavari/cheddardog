import { Account, Ledger, Transaction, AccountRegistry } from '../account';
import { log } from '../util';
import fs from 'fs';

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

export default class Store {
    static load(filename: string): Map<Account, Ledger> {
        let jsonStr = fs.readFileSync(filename, { encoding: 'utf-8' });
        let data = new Map(JSON.parse(jsonStr, reviver));
        return data as Map<Account, Ledger>;
    }

    static save(data: Map<Account, Ledger>, filename: string) {
        log.title('Exporting account list');
        log.start(`saving account data to ${filename}`);
        let stringMap = JSON.stringify([...data]);
        fs.writeFileSync(filename, stringMap);
        log.done(`account data save to ${filename}`);
        log.line('');
    }
}
