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
