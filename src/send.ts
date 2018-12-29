import { SpendingReport, ReportType, base64Heart } from './report';
import { Account, Ledger } from './account';
import { Store } from './store';
import { log, localNowAsDateStr } from './util';
import sendgrid from '@sendgrid/mail';
import config from './config';
import shell from 'shelljs';
import fs from 'fs';

if (!process.env.SENDGRID_API_KEY) {
    throw new Error('missing SENDGRID_API_KEY');
}
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

log.title('Sending latest report');

log.start(`loading all transactions`);
let data: Map<Account, Ledger> = Store.load();
log.done(`all transactions loaded`);

log.start('rendering report');
const subject = `Spending Report ${localNowAsDateStr()}`;
const webRender = SpendingReport.render(data, ReportType.WebPage, subject);
const emailRender = SpendingReport.render(data, ReportType.Email, subject);
log.done('report rendered');

const ofilename = './out/index.html';
log.start(`saving report to ${ofilename}`);
shell.mkdir('-p', './out');
fs.writeFileSync(ofilename, webRender);
log.done(`report saved to ${ofilename}`);

const msg = {
    to: config.send.to,
    from: config.send.from,
    subject,
    html: emailRender,
    attachments: [
        {
            filename: 'heart.png',
            type: 'image/png',
            content: base64Heart,
            content_id: 'lovecid',
            disposition: 'inline'
        }
    ]
};

log.start(`sending report email to ${config.send.to}`);
(async () => await sendgrid.send(msg))();
log.done(`email report sent to ${config.send.to}`);
