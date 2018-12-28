import fs from 'fs';
import Transaction from './transaction';
import { minify } from 'html-minifier';

const CSS_FILENAME = './src/styles.css';
const css = fs.readFileSync(CSS_FILENAME).toString();

const base64Heart =
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAARuAAAEbgHQo7JoAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAIdQTFRF////v0BAzGYz21tJ21VJ1VVK1lxH1lpM2FxI1lxN11pL2FhK11lM2FpL1lpL1llK2VtJ11lJ11pL11lK2FtJ1lpL11tJ11tK2FlL2FlK1lpL11lK11pL11pK11pL11pK11pK11pK11pJ11pK11pK2FpK11pK11pK11pK11pK11pK11pK11pKd2pgRQAAACx0Uk5TAAQFDhUYGSUnMjM0OUFERUlNUlliY3N5e4mW0NTa29/g6ezt7u/x8vb4/P0b22PaAAAAdUlEQVQYGVXBiRZCUABF0UM00KBRCQ0kve7/f1/Isry9ASdcuzTcTejQCHKpOMPlJeUB+KVa+5NapU+iTm3USchkyShkKUhlSYllifEqjVQeREYDE9E4ftUzBzq7jzr1lt7qrcZzyWDxkO5zRma36xTLdMLfD2jjGviUaqLTAAAAAElFTkSuQmCC';

const head = (subject: string) => {
    return `
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>${subject}</title>
        <style>${css}</style>`;
};

const summaryTable = (summary: SpendSummary[]) => {
    return summary
        .map(item => {
            return `
            <table class="summary" align="center">
                <tr><td class="title">${item.name}</td></tr>
                <tr><td class="total">${item.total}</td></tr>
                <tr><td class="count">${item.count} transactions</td></tr>
            </table>`;
        })
        .join('');
};

const transactionTable = (
    transactions: Transaction[],
    formatter: Intl.NumberFormat
): string => {
    return `
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

                return `
                <tr class="transaction ${c}">
                    <td class="date">${date}</td>
                    <td class="description">${descr}</td>
                    <td class="amount">${amount}</td>
                </tr>`;
            })
            .join('')}
    </table>`;
};

const body = (
    summary: SpendSummary[],
    transactions: Transaction[],
    heartSrc: string,
    formatter: Intl.NumberFormat
) => {
    return `
    <table width="100%" height="100%" class="page-container">
    <tr><td>
        <h2>Spending Summary</h2>
        <table align="center">
            <tr><td>${summaryTable(summary)}</td></tr>
            <tr><td>${transactionTable(transactions, formatter)}</td></tr>
            <tr><td class="footer top-space">Made with <img height="10px" src="${heartSrc}" /> by your hubby.</tr></td>
            <tr><td class="footer bottom-space">${new Date().toLocaleString()}</td></tr>
        </table>
    </td></tr></table>`;
};

const render = (
    isEmail: boolean,
    subject: string,
    summary: SpendSummary[],
    transactions: Transaction[],
    formatter: Intl.NumberFormat
): string => {
    let heartSrc = isEmail
        ? 'cid:lovecid'
        : `data:image/png;base64,${base64Heart}`;

    return minify(
        `
    <!DOCTYPE html>
    <html lang="en">
        <head>${head(subject)}</head>
        <body>${body(summary, transactions, heartSrc, formatter)}</body>
    </html>`,
        { collapseWhitespace: true, minifyCSS: true }
    );
};

export default render;
