import { BofA, Amex } from './account';
import { log } from './util';
import { Refresher } from './refresh/';
import { Store } from './store';
import shell from 'shelljs';
import path from 'path';

shell.mkdir('-p', './out');
const outputFilename = path.join('./out/', 'txndb.json');

(async () => {
    log.line('');
    let data = await Refresher.refresh([new Amex(), new BofA()]);
    Store.save(data, outputFilename);
})().catch(e => {
    log.line('');
    log.line(`❌ Error: ${e.message}`);
    log.line(`❌ ${e.stack}`);
    process.exit(-1);
});
