import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const puppeteer = require('puppeteer-extra');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
import * as path from 'path';
import * as fs from 'fs';

puppeteer.use(StealthPlugin());

export interface PostListingPayload {
  title: string;
  price: number;
  description: string;
  location: string;
  condition: string;
  listingType: string;
  images: string[];
  facebookCookie: string;
}

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);

  async postListing(payload: PostListingPayload): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--window-size=1280,900',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    try {
      // Set Facebook session cookies
      const cookies = this.parseCookies(payload.facebookCookie);
      await page.setCookie(...cookies);

      // Navigate to Marketplace create page
      const createUrl = payload.listingType === 'vehicle'
        ? 'https://www.facebook.com/marketplace/create/vehicle'
        : payload.listingType === 'housing'
        ? 'https://www.facebook.com/marketplace/create/rental'
        : 'https://www.facebook.com/marketplace/create/item';

      this.logger.log(`Navigating to ${createUrl}`);
      await page.goto(createUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Check if logged in
      const url = page.url();
      if (url.includes('login') || url.includes('checkpoint')) {
        throw new Error('Facebook session expired. Please update your cookie in Settings.');
      }

      await this.delay(2000);

      // Upload images first
      if (payload.images?.length) {
        await this.uploadImages(page, payload.images);
      }

      await this.delay(1000);

      // Fill title
      await this.fillField(page, 'Title', payload.title);
      await this.delay(500);

      // Fill price
      await this.fillField(page, 'Price', String(payload.price));
      await this.delay(500);

      // Fill location if provided
      if (payload.location) {
        await this.fillField(page, 'Location', payload.location);
        await this.delay(1500);
        // Select first suggestion
        await this.selectFirstSuggestion(page);
      }

      // Fill condition
      if (payload.condition) {
        await this.selectDropdown(page, 'Condition', payload.condition);
        await this.delay(500);
      }

      // Fill description
      if (payload.description) {
        await this.fillField(page, 'Description', payload.description);
        await this.delay(500);
      }

      await this.delay(1500);

      // Click "Next" or "Publish"
      await this.clickPublish(page);
      await this.delay(3000);

      // Try to get the listing URL
      const finalUrl = page.url();
      this.logger.log(`Posted! URL: ${finalUrl}`);

      await browser.close();
      return finalUrl;

    } catch (err) {
      this.logger.error('Facebook posting failed:', err.message);
      // Take screenshot for debugging
      const screenshotPath = `uploads/debug-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {});
      await browser.close();
      throw err;
    }
  }

  private parseCookies(cookieStr: string): any[] {
    try {
      const parsed = JSON.parse(cookieStr);
      // If it's already an array of cookie objects
      if (Array.isArray(parsed)) return parsed.map(c => ({ ...c, domain: '.facebook.com' }));
      // If it's {c_user, xs} format
      const cookies: any[] = [];
      if (parsed.c_user) cookies.push({ name: 'c_user', value: String(parsed.c_user), domain: '.facebook.com' });
      if (parsed.xs) cookies.push({ name: 'xs', value: parsed.xs, domain: '.facebook.com' });
      if (parsed.datr) cookies.push({ name: 'datr', value: parsed.datr, domain: '.facebook.com' });
      return cookies;
    } catch {
      // Try raw cookie string format: "c_user=xxx; xs=yyy"
      return cookieStr.split(';').map(pair => {
        const [name, ...rest] = pair.trim().split('=');
        return { name: name.trim(), value: rest.join('=').trim(), domain: '.facebook.com' };
      }).filter(c => c.name && c.value);
    }
  }

  private async uploadImages(page: any, imagePaths: string[]) {
    try {
      // Look for file input
      const fileInput = await page.$('input[type="file"]');
      if (!fileInput) {
        this.logger.warn('No file input found for images');
        return;
      }
      const absolutePaths = imagePaths.map(p => {
        const clean = p.startsWith('/uploads/') ? p.slice(1) : p.replace(/^\//, '');
        return path.resolve(process.cwd(), clean);
      }).filter(p => fs.existsSync(p));

      if (absolutePaths.length) {
        await fileInput.uploadFile(...absolutePaths);
        await this.delay(3000);
        this.logger.log(`Uploaded ${absolutePaths.length} image(s)`);
      }
    } catch (e) {
      this.logger.warn('Image upload failed:', e.message);
    }
  }

  private async fillField(page: any, label: string, value: string) {
    try {
      // Try aria-label
      const selectors = [
        `[aria-label="${label}"]`,
        `[placeholder="${label}"]`,
        `[aria-label*="${label}"]`,
      ];
      for (const sel of selectors) {
        const el = await page.$(sel);
        if (el) {
          await el.click({ clickCount: 3 });
          await el.type(value, { delay: 40 });
          return;
        }
      }
      this.logger.warn(`Could not find field: ${label}`);
    } catch (e) {
      this.logger.warn(`Failed to fill field "${label}": ${e.message}`);
    }
  }

  private async selectDropdown(page: any, label: string, value: string) {
    try {
      const selectors = [`[aria-label="${label}"]`, `[aria-label*="${label}"]`];
      for (const sel of selectors) {
        const el = await page.$(sel);
        if (el) {
          await el.click();
          await this.delay(500);
          const option = await this.xpathOne(page, `//span[contains(text(), "${value}")]`);
          if (option) {
            await option.click();
            return;
          }
        }
      }
    } catch (e) {
      this.logger.warn(`Failed to select dropdown "${label}": ${e.message}`);
    }
  }

  private async xpathOne(page: any, xpath: string): Promise<any | null> {
    const handle = await page.evaluateHandle((xp: string) => {
      const xr = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return xr.singleNodeValue;
    }, xpath);
    return handle.asElement();
  }

  private async selectFirstSuggestion(page: any) {
    try {
      await this.delay(1000);
      const suggestion = await page.$('[role="option"]');
      if (suggestion) await suggestion.click();
    } catch {}
  }

  private async clickPublish(page: any) {
    const labels = ['Publish', 'Next', 'Post'];
    for (const label of labels) {
      try {
        const btn = await this.xpathOne(page, `//div[@role="button" and .//span[text()="${label}"]]`);
        if (btn) {
          await btn.click();
          this.logger.log(`Clicked "${label}" button`);
          return;
        }
      } catch {}
    }
    this.logger.warn('Could not find Publish/Next button');
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
