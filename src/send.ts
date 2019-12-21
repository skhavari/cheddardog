import { SpendingReport, BalanceReport, ReportType, base64Heart } from './report';
import { Account, Ledger } from './account';
import { Store } from './store';
import { log, localNowAsDateStr } from './util';
import sendgrid from '@sendgrid/mail';
import config from './config';
import shell from 'shelljs';
import fs from 'fs';

const heartAttachment = {
    filename: 'heart.png',
    type: 'image/png',
    content: base64Heart,
    content_id: 'lovecid',
    disposition: 'inline'
};
const attachments = [heartAttachment];

let saveOnly = process.env.CHEDDARDOG_SAVEONLY;

if (!process.env.SENDGRID_API_KEY) {
    throw new Error('missing SENDGRID_API_KEY');
}
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
shell.mkdir('-p', './out');

const saveReport = (filename: string, contents: string) => {
    log.start(`saving report to ${filename}`);
    fs.writeFileSync(filename, contents);
    log.succeed(`report saved to ${filename}`);
};

const sendReport = (to: string | string[], from: string, subject: string, html: string) => {
    const msg = {
        to,
        from,
        subject,
        html,
        attachments
    };

    log.start(`sending report email to ${msg.to}`);
    (async () => await sendgrid.send(msg))();
    log.succeed(`email report sent to ${msg.to}`);
};

//  Init
log.title('Report Initialization');
log.start(`loading all transactions`);
let data: Map<Account, Ledger> = Store.load();
log.succeed(`all transactions loaded`);

//  Spending Report
log.title('Spending Report');
log.start('rendering spending report');
let subject = `Spending Report ${localNowAsDateStr()}`;
let webRender = SpendingReport.render(data, ReportType.WebPage, subject);
let emailRender = SpendingReport.render(data, ReportType.Email, subject);
log.succeed('spending report rendered');
saveReport('./out/spending.html', webRender);
if (!saveOnly) {
    sendReport(config.send.to, config.send.from, subject, emailRender);
}

//  Balance Report
log.title('Balance Report');
log.start('rendering balance report');
subject = `Balance Report ${localNowAsDateStr()}`;
webRender = BalanceReport.render(data, ReportType.WebPage, subject);
emailRender = BalanceReport.render(data, ReportType.Email, subject);
log.succeed('balance report rendered');
saveReport('./out/balance.html', webRender);
if (!saveOnly) {
    sendReport(config.send.to, config.send.from, subject, emailRender);
}
