import puppeteer, { Browser } from 'puppeteer';

let launchPromise: Promise<Browser> | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!launchPromise) {
    launchPromise = puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return launchPromise;
}

export async function closeBrowser(): Promise<void> {
  if (launchPromise) {
    const browser = await launchPromise;
    await browser.close();
    launchPromise = null;
  }
}
