import { logTitle, logStart, logDone, logLine } from './logger';
import puppeteer from 'puppeteer';
import packageInfo from '../package.json';

const launchParams = {
    headless: false,
    defaultViewport: {
        width: 1280,
        height: 1024
    }
};

export const init = async () => {
    logTitle(`Starting ${packageInfo.name} v${packageInfo.version}`);
    logStart('launching browser');
    let browser = await puppeteer.launch(launchParams);
    logDone('browser launched');

    logStart('creating new page');
    let page = await browser.newPage();
    logDone('page created');
    logLine('');
    return { browser, page };
};

export const shutdown = async (browser: puppeteer.Browser) => {
    logTitle(`Shutting down ${packageInfo.name} v${packageInfo.version}`);
    logStart('closing browser');
    await browser.close();
    logDone('browser closed');
    logLine('');
};
