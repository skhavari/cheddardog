import { AccountRegistry, Account } from './account';
import { log } from './util';
import { Refresher } from './refresh/';
import { Store } from './store';
import config from './config';

log.title('Refresh configuration');
log.start('reading refresh configuration');
let accountNames = config.refresh.accounts;
let refreshAccounts = accountNames.map(name => AccountRegistry.newAccountFromName(name));
log.succeed(`refresh configuration read.  Will refresh ${refreshAccounts.length} accounts`);

(async () => {
    log.line('');
    const results = await Refresher.refresh(refreshAccounts);
    Store.update(results.data);
    printErrors(results.errors);
})().catch(e => {
    log.line('');
    log.line(`❌ Error: ${e.message}`);
    log.line(`❌ ${e.stack}`);
    process.exit(-1);
});

function printErrors(errors: Map<Account, any>): void {
    if (errors.size === 0) {
        return;
    }
    log.title(`Failed to refresh ${errors.size} accounts`);
    errors.forEach((error, account) => {
        log.start('');
        log.fail(`Failed to refresh ${account.displayName}: ${error}`);
    });
}
