import log from './logger';
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

// a date range
export interface DateRange {
    start: Date;
    end: Date;
}

// craete a range for n days ago
export const rangeFromDaysAgo = (daysAgo: number): DateRange => {
    let end = new Date();
    end.setHours(0, 0, 0, 0);
    let start = new Date();
    start.setDate(end.getDate() - daysAgo);
    start.setHours(0, 0, 0, 0);
    return { start, end };
};

export const USDNumberFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
});

export const localNowAsDateStr = (): string => {
    const tzoffset = new Date().getTimezoneOffset() * 60000;
    const now = new Date(Date.now() - tzoffset);
    return now.toISOString().split('T')[0];
};

const addLeadingZero = (n: number): string => {
    return `${n < 10 ? '0' : ''}${n}`;
};

export const moDayYearWithLeadingZeros = (d: Date): string => {
    let mo = addLeadingZero(d.getMonth() + 1);
    let day = addLeadingZero(d.getDate());
    let year = d.getFullYear();
    return `${mo}/${day}/${year}`;
};
