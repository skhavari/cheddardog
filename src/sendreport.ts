import AccountList from './accountlist';
import path from 'path';
import Transaction from './transaction';
import fs from 'fs';
import sendgrid from '@sendgrid/mail';
import log from './logger';

const filename = path.join('./', 'txndb.json');

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

interface SpendSummary {
    name: string;
    total: string;
    count: number;
}

log.title('Sending latest report');

// load the transaction list from file
log.start(`loading transactions from ${filename}`);
let list: AccountList = AccountList.loadFromFile(filename);
log.done(`transactions loaded from ${filename}`);

// sort by date, descending
log.start('generating summary');
let txns: Transaction[] = list.transactions.sort((a, b) => {
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

const render = (isEmail: boolean) => {
    let heartSrc = isEmail
        ? 'cid:lovecid'
        : `data:image/png;base64,${base64Heart}`;

    //TODO: clean this up, move css to its own file, yank out summary table and transaction table
    //TODO: per account info: balances, spend per account
    return `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>${subject}</title>
        <style>
        html, body {
            font-family: "Verdana";
            background-color: #1B3A4A;
            color: white;
            padding: 0;
            margin: 0;
        }
        .page-container {
            font-family: "Verdana";
            background-color: #1B3A4A;
            color: white;
            padding: 0;
            margin: 0;
        }
        h2{
            text-align: center;
        }
        .summary {
            text-align: center;
            width: 100%;
            padding: 0;
            border-spacing: 0;
            margin-top: 30px;
        }
        .title {
            margin-top: 30px;
            padding: 10px 10px 10px 0;
            text-align: left;
            color: white;
        }
        .total {
            text-align: center;
            color: #F05151;
            background-color: rgba(255, 255, 255, 0.1);
            font-size: xx-large;
            padding: 25px;
        }
        .count {
            padding: 5px;
            text-align: right;
            color: #4EA9DE;
            font-size: small;
        }
        .transactions {
            font-size: small;
            line-height: 1.5rem;
            min-width: 280px;
            padding-top: 30px;
        }
        .transactions-title {
            margin-top: 30px;
            text-align: left;
            color: white;
            font-size: initial;
            padding-bottom: 10px;
        }
        .transaction {
            background-color: rgba(255, 255, 255, 0.1);
            color: rgba(255,255,255,0.5);
        }
        .transactions .transaction td {
            padding: 0 10px 0 10px;
            line-height: 2rem;
        }
        .date {
            white-space: nowrap;
        }
        .amount {
            white-space: nowrap;
            text-align: right;
        }
        .description {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .footer {
            font-size: small;
            color: rgba(255, 255, 255, 0.1);
            text-align: center;
        }
        .top-space {
            padding-top: 100px;
        }
        .bottom-space {
            padding-bottom: 100px;
        }
        .baller {
            color: #F05151;
            font-weight: bold;
        }
        .warning {
            color: #F05151;
        }
        .danger {
            color: #F77F00;
        }
        .good {
            color: #25B16A;
        }
        </style>
    </head>
    <body>
        <table width="100%" height="100%" class="page-container"><tr><td>
            <h2>Spending Summary</h2>
            <table align="center"><tr><td>
            ${summary
                .map(item => {
                    return `<table class="summary" align="center">
                    <tr><td class="title">${item.name}</td></tr>
                    <tr><td class="total">${item.total}</td></tr>
                    <tr><td class="count">${
                        item.count
                    } transactions</td></tr></table>`;
                })
                .join('')}
            </td></tr>
            <tr><td>
                <table class="transactions" align="center" cellpadding="0" cellspacing="0">
                <tr><td class="transactions-title" colspan="3">Transactions</td></tr>
                ${transactions
                    .map(t => {
                        const mo = t.date.getMonth() + 1;
                        const day = t.date.getDate();
                        const date = `${mo}-${day}`;
                        const descr = `${t.description.slice(0, 15)}`;
                        const amount = `${formatter.format(t.amount)}`;

                        let c = '';

                        if (t.amount <= -250) {
                            c = 'baller';
                        } else if (t.amount <= -100) {
                            c = 'warning';
                        } else if (t.amount <= -50) {
                            c = 'danger';
                        } else if (t.amount > 0) {
                            c = 'good';
                        }

                        return `<tr class="transaction ${c}">
                            <td class="date">${date}</td>
                            <td class="description">${descr}</td>
                        <td class="amount">${amount}</td>
                        </tr>`;
                    })
                    .join('')}
                </table>
            </td></tr>
            <tr><td class="footer top-space">Made with <img height="10px" src="${heartSrc}" /> by your hubby.</tr></td>
            <tr><td class="footer bottom-space">${new Date().toLocaleString()}</td></tr>
            </table>
        </td></tr></table>
    </body>
</html>`;
};

const ofilename = './index.html';
log.start(`saving report to ${ofilename}`);
fs.writeFileSync(ofilename, render(false));
log.done(`report saved to ${ofilename}`);

if (!process.env.SEND_TO || !process.env.SEND_FROM) {
    throw new Error('missing SEND_TO and/or SEND_FROM');
}

let to = process.env.SEND_TO.split(' ');
let from = process.env.SEND_FROM;

const msg = {
    to,
    from,
    subject,
    html: render(true),
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

log.start(`sending report email to ${to}`);
(async () => await sendgrid.send(msg))();
log.done(`email report sent to ${to}`);
