import fs from 'fs';
import {
    Transaction,
    Account,
    Ledger,
    getAllTransactions,
    getTransactionSinceDaysAgo
} from '../account';
import { minify } from 'html-minifier';
import { base64Heart, ReportType } from './shared';
import { USDNumberFormatter } from '../util';

interface SpendingReportParams {
    outputType: ReportType;
    subject: string;
    summary: SpendSummary[];
    transactions: Transaction[];
}

const CSS_FILENAME = './static/report/spendingreport.css';
const css = fs.readFileSync(CSS_FILENAME).toString();

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

const transactionRow = (t: Transaction): string => {
    const mo = t.date.getMonth() + 1;
    const day = t.date.getDate();
    const date = `${mo}-${day}`;
    const descr = `${t.description.slice(0, 15)}`;
    const amount = `${USDNumberFormatter.format(t.amount)}`;

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
};

const transactionTable = (transactions: Transaction[]): string => {
    return `
    <table class="transactions" align="center" cellpadding="0" cellspacing="0">
        <tr><td class="transactions-title" colspan="3">Transactions</td></tr>
        ${transactions.map(transactionRow).join('')}
    </table>`;
};

const body = (
    summary: SpendSummary[],
    transactions: Transaction[],
    heartSrc: string
) => {
    return `
    <table width="100%" height="100%" class="page-container">
    <tr><td>
        <h2>Spending Summary</h2>
        <table align="center">
            <tr><td>${summaryTable(summary)}</td></tr>
            <tr><td>${transactionTable(transactions)}</td></tr>
            <tr><td class="footer top-space">Made with <img height="10px" src="${heartSrc}" /> by your hubby.</tr></td>
            <tr><td class="footer bottom-space">${new Date().toLocaleString()}</td></tr>
        </table>
    </td></tr></table>`;
};

const renderSpendingReport = ({
    outputType,
    subject,
    summary,
    transactions
}: SpendingReportParams): string => {
    let heartSrc =
        outputType === ReportType.Email
            ? 'cid:lovecid'
            : `data:image/png;base64,${base64Heart}`;

    return minify(
        `<!DOCTYPE html>
        <html lang="en">
            <head>${head(subject)}</head>
            <body>${body(summary, transactions, heartSrc)}</body>
        </html>`,
        { collapseWhitespace: true, minifyCSS: true }
    );
};

export default class SpendingReport {
    static render(
        data: Map<Account, Ledger>,
        type: ReportType,
        subject: string
    ): string {
        let allTxns = getAllTransactions(data);
        let transactions = getTransactionSinceDaysAgo(allTxns, 7);
        let summary = SpendingReport.getSpendSummaries(allTxns);

        const webPageReportParams: SpendingReportParams = {
            outputType: ReportType.WebPage,
            subject,
            summary,
            transactions
        };
        const emailReportParams: SpendingReportParams = {
            outputType: ReportType.Email,
            subject,
            summary,
            transactions
        };

        if (type === ReportType.WebPage) {
            return renderSpendingReport(webPageReportParams);
        }
        return renderSpendingReport(emailReportParams);
    }

    private static getSpendSummaries(txns: Transaction[]): SpendSummary[] {
        type StringAndTransactionsPair = [string, Transaction[]];
        let spendSummary: SpendSummary[] = [];
        let tuples: Array<StringAndTransactionsPair> = [1, 7, 14, 28].map(
            (daysAgo: number): StringAndTransactionsPair => {
                return [
                    `${daysAgo}`,
                    getTransactionSinceDaysAgo(txns, daysAgo)
                ];
            }
        );

        // compute the summary for each daysAgo block
        tuples.forEach(([name, filtered]) => {
            let total = filtered.reduce((sum, txn) => {
                return sum + txn.amount;
            }, 0);

            name = `${name} day${name === '1' ? '' : 's'}`;
            total = Math.abs(total);

            spendSummary.push({
                name,
                total: USDNumberFormatter.format(total),
                count: filtered.length
            });
        });

        return spendSummary;
    }
}
