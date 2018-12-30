import { minify } from 'html-minifier';
import sass from 'node-sass';
import { base64Heart, ReportType } from './shared';

const head = (title: string, scssFilename: string) => {
    const result = sass.renderSync({ file: scssFilename });

    return `
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>${title}</title>
        <style>${result.css}</style>`;
};

export default function render(
    title: string,
    name: string,
    body: string,
    scssFilename: string,
    outputType: ReportType
): string {
    let heartSrc =
        outputType === ReportType.Email
            ? 'cid:lovecid'
            : `data:image/png;base64,${base64Heart}`;

    return minify(
        `<!DOCTYPE html>
        <html lang="en">
            <head>${head(title, scssFilename)}</head>
            <body>
                <table width="100%" height="100%" class="page-container">
                <tr><td>
                    <h2>${name}</h2>
                    <table align="center">
                        <tr><td>${body}</td></tr>
                        <tr><td class="footer top-space">Made with <img height="10px" src="${heartSrc}" /> by your hubby.</tr></td>
                        <tr><td class="footer bottom-space">${new Date().toLocaleString()}</td></tr>
                    </table>
                </td></tr></table>
            </body>
        </html>`,
        { collapseWhitespace: true, minifyCSS: true }
    );
}
