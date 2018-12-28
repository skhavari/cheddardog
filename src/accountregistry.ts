import Account from './account';
import Amex from './amex';
import BofA from './bofa';

let registry: Account[] = [new Amex(), new BofA()];

let nameToAccount = registry.reduce((prev, curr) => {
    prev.set(curr.displayName, curr);
    return prev;
}, new Map<string, Account>());

export default class AccountRegistry {
    static newAccountFromName(accountName: string): Account {
        let result = nameToAccount.get(accountName);
        if (result === undefined) {
            throw new Error(`Unknown account name: ${accountName}`);
        }
        return result;
    }
}
