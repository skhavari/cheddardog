import { BofA, Amex, AccountList } from './account';
import { BrowserUtil, log } from './util';
import path from 'path';
import shell from 'shelljs';

shell.mkdir('-p', './out');
const outputFilename = path.join('./out/', 'txndb.json');

(async () => {
    log.line('');
    let browser = await BrowserUtil.newBrowser();
    let page = await BrowserUtil.newPage(browser);

    let list = new AccountList();
    await list.refreshData([new Amex(), new BofA()], page);
    list.save(outputFilename);

    await BrowserUtil.shudown(browser);
})().catch(e => {
    log.line('');
    log.line(`❌ Error: ${e.message}`);
    log.line(`❌ ${e.stack}`);
    process.exit(-1);
});
