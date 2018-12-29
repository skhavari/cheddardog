import {
    BofA,
    Amex,
    Vanguard,
    Schwab,
    AccountRegistry as Registry
} from './account';
import { log } from './util';
import { Refresher } from './refresh/';
import { Store } from './store';
import config from './config';
import shell from 'shelljs';
import path from 'path';

shell.mkdir('-p', './out');
const outputFilename = path.join('./out/', 'txndb.json');

log.title('Refresh configuration');
log.start('reading refresh configuration');
let accountNames = config.refresh.accounts;
let refreshAccounts = accountNames.map(name =>
    Registry.newAccountFromName(name)
);
log.done(
    `refresh configuration read.  Will refresh ${
        refreshAccounts.length
    } accounts`
);

(async () => {
    log.line('');
    let data = await Refresher.refresh(refreshAccounts);
    Store.save(data, outputFilename);
})().catch(e => {
    log.line('');
    log.line(`❌ Error: ${e.message}`);
    log.line(`❌ ${e.stack}`);
    process.exit(-1);
});
