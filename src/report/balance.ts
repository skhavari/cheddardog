import { ReportType } from './shared';
import { USDNumberFormatter } from '../util';
import { Account, Ledger } from '../account';
import renderTemplate from './template';

const scssFilename = './static/report/balance.scss';

const balanceSummary = (data: Map<Account, Ledger>): string => {
    let tuples = Array.from(data.entries());
    let rows = tuples.map(
        ([account, ledger]) => `<tr class="account-row">
            <td class="account">${account.displayName}</td>
            <td class="balance ${
                ledger.balance > 0 ? 'good' : 'warning'
            }">${USDNumberFormatter.format(ledger.balance)}</td>
        </tr>`
    );

    let total = tuples.reduce((sum, curr) => (sum += curr[1].balance), 0);
    let totalStr = USDNumberFormatter.format(total);
    rows.push(`<tr>
        <td class="total account">Total</td>
        <td class="total balance">${totalStr}</td>
    </tr>`);

    return `<table class="balance-summary" align="center" cellpadding="0" cellspacing="0">
        ${rows.join('')}
    </table>`;
};

export default class BalanceReport {
    static render(
        data: Map<Account, Ledger>,
        type: ReportType,
        subject: string
    ): string {
        return renderTemplate(
            subject,
            'Balance Report',
            balanceSummary(data),
            scssFilename,
            type
        );
    }
}
