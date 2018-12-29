import { AccountRegistry } from './account';
import { log } from './util';
import { Refresher } from './refresh/';
import { Store } from './store';
import config from './config';

log.title('Refresh configuration');
log.start('reading refresh configuration');
let accountNames = config.refresh.accounts;
let refreshAccounts = accountNames.map(name =>
    AccountRegistry.newAccountFromName(name)
);
log.done(
    `refresh configuration read.  Will refresh ${
        refreshAccounts.length
    } accounts`
);

(async () => {
    log.line('');
    let data = await Refresher.refresh(refreshAccounts);
    Store.save(data);
})().catch(e => {
    log.line('');
    log.line(`❌ Error: ${e.message}`);
    log.line(`❌ ${e.stack}`);
    process.exit(-1);
});
