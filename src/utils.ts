import { logStart, logDone } from './logger';
import puppeteer from 'puppeteer';

/**
 * resolve a promise in ms millis
 * @param ms
 */
export const sleep = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms));

/**
 * get download dir on mac
 */
export const getDownloadDir = () => `${process.env.HOME}/Downloads`;

/**
 * Simple form based login.
 *
 * @param page - Puppeteer page object
 * @param url - the page to load to then orchestrate a login
 * @param username - the account's username
 * @param password - the account's password
 * @param usernameSelector - the selector of the username field
 * @param passwordSelector - the selector of the password field
 * @param submitSelector - the selector of the submit button
 */
export const simpleLogin = async (
    page: puppeteer.Page,
    url: string,
    username: string,
    password: string,
    usernameSelector: string,
    passwordSelector: string,
    submitSelector: string
): Promise<void> => {
    logStart(`opening ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    logDone(`${url} loaded`);

    logStart('entinering username');
    await page.focus(usernameSelector);
    await page.type(usernameSelector, username, { delay: 20 });
    logDone('username entered');

    logStart('entering password');
    await page.focus(passwordSelector);
    await page.type(passwordSelector, password, { delay: 20 });
    logDone('password entered');

    logStart('signing in');
    await Promise.all([
        await page.click(submitSelector, { delay: 100 }),
        await page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);
    logDone('signed in');
};
