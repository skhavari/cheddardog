import {
    Transaction,
    Account,
    Ledger,
    getAllTransactions,
    getTransactionSinceDaysAgo
} from '../account';
import { ReportType } from './shared';
import { USDNumberFormatter } from '../util';
import renderTemplate from './template';

const scssFilename = './static/report/spending.scss';

const summaryTable = (summary: SpendSummary[]) => {
    return summary
        .map(item => {
            const color = item.total > 0 ? 'good' : 'warning';
            return `
            <table class="summary" align="center">
                <tr><td class="title">${item.name}</td></tr>
                <tr><td class="total ${color}">${USDNumberFormatter.format(
                item.total
            )}</td></tr>
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

const body = (summary: SpendSummary[], transactions: Transaction[]) => {
    return `<table align="center" width="100%">
        <tr><td>${summaryTable(summary)}</td></tr>
        <tr><td>${transactionTable(transactions)}</td></tr>
    </table>`;
};

const renderSpendingReport = (
    outputType: ReportType,
    subject: string,
    summary: SpendSummary[],
    transactions: Transaction[]
): string => {
    return renderTemplate(
        subject,
        'Spending Report',
        body(summary, transactions),
        scssFilename,
        outputType
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

        return renderTemplate(
            subject,
            'Spending Report',
            body(summary, transactions),
            scssFilename,
            type
        );
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
                let amount = txn.amount > 0 ? 0 : txn.amount;
                return sum + amount;
            }, 0);

            spendSummary.push({
                name: `${name} day${name === '1' ? '' : 's'}`,
                total,
                count: filtered.length
            });
        });

        return spendSummary;
    }
}
