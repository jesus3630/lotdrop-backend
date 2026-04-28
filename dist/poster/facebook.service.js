"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var FacebookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookService = void 0;
const common_1 = require("@nestjs/common");
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
puppeteer.use(StealthPlugin());
let FacebookService = FacebookService_1 = class FacebookService {
    logger = new common_1.Logger(FacebookService_1.name);
    async postListing(payload) {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--disable-dev-shm-usage',
                '--window-size=1280,900',
            ],
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 900 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        try {
            const cookies = this.parseCookies(payload.facebookCookie);
            await page.setCookie(...cookies);
            const createUrl = payload.listingType === 'vehicle'
                ? 'https://www.facebook.com/marketplace/create/vehicle'
                : payload.listingType === 'housing'
                    ? 'https://www.facebook.com/marketplace/create/rental'
                    : 'https://www.facebook.com/marketplace/create/item';
            this.logger.log(`Navigating to ${createUrl}`);
            await page.goto(createUrl, { waitUntil: 'networkidle2', timeout: 45000 });
            const currentUrl = page.url();
            if (currentUrl.includes('login') || currentUrl.includes('checkpoint')) {
                throw new Error('Facebook session expired. Please update your cookie in Settings.');
            }
            await page.waitForSelector('[role="main"]', { timeout: 20000 });
            await this.delay(2500);
            if (payload.images?.length) {
                await this.uploadImages(page, payload.images);
                await this.delay(2500);
            }
            if (payload.listingType === 'vehicle') {
                await this.fillVehicleForm(page, payload);
            }
            else {
                await this.fillItemForm(page, payload);
            }
            await this.delay(1500);
            const clicked = await this.clickNextOrPublish(page);
            if (!clicked)
                throw new Error('Could not find Next or Publish button');
            await this.delay(3000);
            await this.clickNextOrPublish(page).catch(() => { });
            await this.delay(3000);
            const finalUrl = page.url();
            this.logger.log(`Posted! URL: ${finalUrl}`);
            await browser.close();
            return finalUrl;
        }
        catch (err) {
            this.logger.error('Facebook posting failed:', err.message);
            const screenshotPath = `/tmp/lotdrop-debug-${Date.now()}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => { });
            this.logger.log(`Debug screenshot saved: ${screenshotPath}`);
            await browser.close();
            throw err;
        }
    }
    async fillItemForm(page, payload) {
        await this.fillField(page, 'Title', payload.title, true);
        await this.delay(300);
        await this.fillField(page, 'Price', String(payload.price), true);
        await this.delay(300);
        if (payload.condition) {
            await this.selectDropdown(page, 'Condition', payload.condition);
            await this.delay(500);
        }
        if (payload.description) {
            await this.fillField(page, 'Description', payload.description);
            await this.delay(300);
        }
        if (payload.location) {
            await this.fillLocationField(page, payload.location);
        }
    }
    async fillVehicleForm(page, payload) {
        if (payload.year) {
            await this.fillField(page, 'Year', String(payload.year));
            await this.delay(400);
        }
        if (payload.make) {
            await this.fillOrSelectWithSuggestion(page, 'Make', payload.make);
            await this.delay(600);
        }
        if (payload.model) {
            await this.fillOrSelectWithSuggestion(page, 'Model', payload.model);
            await this.delay(600);
        }
        if (payload.mileage) {
            await this.fillField(page, 'Mileage', String(payload.mileage));
            await this.delay(300);
        }
        await this.fillField(page, 'Price', String(payload.price));
        await this.delay(300);
        if (payload.description) {
            await this.fillField(page, 'Description', payload.description);
            await this.delay(300);
        }
        if (payload.location) {
            await this.fillLocationField(page, payload.location);
        }
        if (payload.exteriorColor) {
            await this.selectDropdown(page, 'Exterior color', payload.exteriorColor);
            await this.delay(400);
        }
        if (payload.transmission) {
            await this.selectDropdown(page, 'Transmission', payload.transmission);
            await this.delay(400);
        }
    }
    parseCookies(cookieStr) {
        try {
            const parsed = JSON.parse(cookieStr);
            if (Array.isArray(parsed))
                return parsed.map(c => ({ ...c, domain: '.facebook.com' }));
            const cookies = [];
            if (parsed.c_user)
                cookies.push({ name: 'c_user', value: String(parsed.c_user), domain: '.facebook.com' });
            if (parsed.xs)
                cookies.push({ name: 'xs', value: parsed.xs, domain: '.facebook.com' });
            if (parsed.datr)
                cookies.push({ name: 'datr', value: parsed.datr, domain: '.facebook.com' });
            return cookies;
        }
        catch {
            return cookieStr
                .split(';')
                .map(pair => {
                const [name, ...rest] = pair.trim().split('=');
                return { name: name.trim(), value: rest.join('=').trim(), domain: '.facebook.com' };
            })
                .filter(c => c.name && c.value);
        }
    }
    async uploadImages(page, imagePaths) {
        const absolutePaths = imagePaths
            .map(p => {
            const clean = p.startsWith('/uploads/') ? p.slice(1) : p.replace(/^\//, '');
            return path.resolve(process.cwd(), clean);
        })
            .filter(p => fs.existsSync(p));
        if (!absolutePaths.length) {
            this.logger.warn('No valid image files found for upload');
            return;
        }
        try {
            const photoAreaSelectors = [
                '[aria-label="Add photos"]',
                '[aria-label*="photo"]',
                '[aria-label*="Photo"]',
                '[data-testid="marketplace-pdp-photos"]',
            ];
            for (const sel of photoAreaSelectors) {
                const area = await page.$(sel);
                if (area) {
                    const tag = await area.evaluate((e) => e.tagName.toLowerCase());
                    if (tag !== 'input') {
                        await area.click().catch(() => { });
                        await this.delay(800);
                    }
                    break;
                }
            }
            let fileInput = await page.$('input[accept*="image"], input[type="file"]');
            if (!fileInput) {
                this.logger.warn('No file input found — skipping image upload');
                return;
            }
            await fileInput.uploadFile(...absolutePaths);
            await this.delay(4000);
            this.logger.log(`Uploaded ${absolutePaths.length} image(s)`);
        }
        catch (e) {
            this.logger.warn('Image upload failed:', e.message);
        }
    }
    async fillField(page, label, value, required = false) {
        const selectors = [
            `[aria-label="${label}"]`,
            `[placeholder="${label}"]`,
            `[aria-label*="${label}"]`,
        ];
        for (const sel of selectors) {
            try {
                const el = required
                    ? await page.waitForSelector(sel, { timeout: 8000 }).catch(() => null)
                    : await page.$(sel);
                if (el) {
                    await el.click({ clickCount: 3 });
                    await page.keyboard.press('Backspace');
                    await el.type(value, { delay: 50 });
                    return;
                }
            }
            catch { }
        }
        this.logger.warn(`Could not find field: ${label}`);
    }
    async fillOrSelectWithSuggestion(page, label, value) {
        const el = await page.$(`[aria-label="${label}"]`);
        if (el) {
            const tag = await el.evaluate((e) => e.tagName.toLowerCase());
            if (tag === 'input' || tag === 'textarea') {
                await el.click({ clickCount: 3 });
                await el.type(value, { delay: 50 });
                await this.delay(800);
                await this.selectFirstSuggestion(page);
                return;
            }
        }
        await this.selectDropdown(page, label, value);
    }
    async fillLocationField(page, location) {
        await this.fillField(page, 'Location', location);
        await this.delay(1800);
        await this.selectFirstSuggestion(page);
    }
    async selectDropdown(page, label, value) {
        const selectors = [`[aria-label="${label}"]`, `[aria-label*="${label}"]`];
        for (const sel of selectors) {
            const el = await page.$(sel);
            if (el) {
                await el.click();
                await this.delay(600);
                const option = await this.findOptionByText(page, value);
                if (option) {
                    await option.click();
                    return;
                }
                break;
            }
        }
        this.logger.warn(`Could not select dropdown "${label}" = "${value}"`);
    }
    async findOptionByText(page, text) {
        try {
            await page.waitForSelector('[role="option"], [role="listitem"]', { timeout: 3000 });
        }
        catch { }
        const options = await page.$$('[role="option"]');
        for (const opt of options) {
            const t = await opt.evaluate((e) => e.textContent?.trim() ?? '');
            if (t.toLowerCase().includes(text.toLowerCase()))
                return opt;
        }
        const handle = await page.evaluateHandle((searchText) => {
            const xp = `//li[contains(normalize-space(.), "${searchText}")] | //div[@role="option" and contains(normalize-space(.), "${searchText}")]`;
            const r = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            return r.singleNodeValue;
        }, text);
        return handle.asElement();
    }
    async selectFirstSuggestion(page) {
        try {
            await page.waitForSelector('[role="option"], [role="listitem"]', { timeout: 3000 });
            const first = await page.$('[role="option"], [role="listitem"]');
            if (first)
                await first.click();
        }
        catch { }
    }
    async clickNextOrPublish(page) {
        for (const label of ['Next', 'Publish', 'Post']) {
            const byAttr = await page.$(`[aria-label="${label}"][role="button"], button[aria-label="${label}"]`);
            if (byAttr) {
                await byAttr.click();
                this.logger.log(`Clicked "${label}" (aria-label)`);
                return true;
            }
            const handle = await page.evaluateHandle((lbl) => {
                const xp = `//div[@role="button" and .//span[text()="${lbl}"]] | //button[.//span[text()="${lbl}"]]`;
                const r = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                return r.singleNodeValue;
            }, label);
            const el = handle.asElement();
            if (el) {
                await el.click();
                this.logger.log(`Clicked "${label}" button`);
                return true;
            }
        }
        return false;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
exports.FacebookService = FacebookService;
exports.FacebookService = FacebookService = FacebookService_1 = __decorate([
    (0, common_1.Injectable)()
], FacebookService);
//# sourceMappingURL=facebook.service.js.map