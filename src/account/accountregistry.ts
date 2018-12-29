import Account from './account';
import { Vanguard, Schwab, Amex, BofA } from './institutions';

let registry: Account[] = [
    new Amex(),
    new BofA(),
    new Vanguard(),
    new Schwab()
];

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
