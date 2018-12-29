import { Account, Ledger, Transaction } from './account';
import { Store } from './store';
import path from 'path';
import fs from 'fs';
import sendgrid from '@sendgrid/mail';
import { log } from './util';
import render from './report/render';
import shell from 'shelljs';
import config from './config';

const filename = path.join('./out/', 'txndb.json');

// a date range
interface Range {
    start: Date;
    end: Date;
}

// craete a range for n days ago
let rangeFromDaysAgo = (daysAgo: number): Range => {
    let end = new Date();
    end.setHours(0, 0, 0, 0);
    let start = new Date();
    start.setDate(end.getDate() - daysAgo);
    start.setHours(0, 0, 0, 0);
    return { start, end };
};

// a predicate fn to filter transactions
type txnToBoolFn = (t: Transaction) => boolean;

type StringAndFilterPair = [string, txnToBoolFn];

// given a range, create a predicate function to return transactions in the date range
let makeRangeFilter: (r: Range) => txnToBoolFn = ({ start, end }: Range) => {
    return (t: Transaction): boolean => start <= t.date && t.date < end;
};

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
});

log.title('Sending latest report');

// load the transaction list from file
log.start(`loading transactions from ${filename}`);
let list: Map<Account, Ledger> = Store.load(filename);
log.done(`transactions loaded from ${filename}`);

// sort by date, descending
log.start('generating summary');
let ledgers: Ledger[] = Array.from(list.values());
let temp: Array<Transaction[]> = ledgers.map(ledger => ledger.transactions);
let allTransactions: Transaction[] = ([] as Transaction[]).concat(...temp);
let txns: Transaction[] = allTransactions.sort((a, b) => {
    return b.date.getTime() - a.date.getTime();
});

// create an array of daysAgo, filters pairs, to intialize a map
let tuples: Array<StringAndFilterPair> = [1, 7, 14, 28].map(
    (daysAgo: number): StringAndFilterPair => {
        return [`${daysAgo}`, makeRangeFilter(rangeFromDaysAgo(daysAgo))];
    }
);

// compute the summary for each daysAgo block
let transactions: Transaction[] = [];
let summary: SpendSummary[] = [];
new Map(tuples).forEach((filter, name) => {
    let filtered = txns.filter(filter);
    let total = filtered.reduce((sum, txn) => {
        return sum + txn.amount;
    }, 0);

    if (name == '7') {
        transactions = filtered;
    }

    name = `${name} day${name === '1' ? '' : 's'}`;
    total = Math.abs(total);

    summary.push({
        name,
        total: formatter.format(total),
        count: filtered.length
    });
});
log.done('summary generated');

const tzoffset = new Date().getTimezoneOffset() * 60000;
const now = new Date(Date.now() - tzoffset);
const subject = `Spending Report ${now.toISOString().split('T')[0]}`;

const base64Heart =
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAARuAAAEbgHQo7JoAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAIdQTFRF////v0BAzGYz21tJ21VJ1VVK1lxH1lpM2FxI1lxN11pL2FhK11lM2FpL1lpL1llK2VtJ11lJ11pL11lK2FtJ1lpL11tJ11tK2FlL2FlK1lpL11lK11pL11pK11pL11pK11pK11pK11pJ11pK11pK2FpK11pK11pK11pK11pK11pK11pK11pKd2pgRQAAACx0Uk5TAAQFDhUYGSUnMjM0OUFERUlNUlliY3N5e4mW0NTa29/g6ezt7u/x8vb4/P0b22PaAAAAdUlEQVQYGVXBiRZCUABF0UM00KBRCQ0kve7/f1/Isry9ASdcuzTcTejQCHKpOMPlJeUB+KVa+5NapU+iTm3USchkyShkKUhlSYllifEqjVQeREYDE9E4ftUzBzq7jzr1lt7qrcZzyWDxkO5zRma36xTLdMLfD2jjGviUaqLTAAAAAElFTkSuQmCC';

const fileHtml = render(false, subject, summary, transactions, formatter);
const emailHtml = render(true, subject, summary, transactions, formatter);

const ofilename = './out/index.html';
log.start(`saving report to ${ofilename}`);
shell.mkdir('-p', './out');
fs.writeFileSync(ofilename, fileHtml);
log.done(`report saved to ${ofilename}`);

const msg = {
    to: config.send.to,
    from: config.send.from,
    subject,
    html: emailHtml,
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

if (!process.env.SENDGRID_API_KEY) {
    throw new Error('missing SENDGRID_API_KEY');
}

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

log.start(`sending report email to ${config.send.to}`);
(async () => await sendgrid.send(msg))();
log.done(`email report sent to ${config.send.to}`);
