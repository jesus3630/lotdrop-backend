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
                '--window-size=1280,900',
            ],
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 900 });
        try {
            const cookies = this.parseCookies(payload.facebookCookie);
            await page.setCookie(...cookies);
            const createUrl = payload.listingType === 'vehicle'
                ? 'https://www.facebook.com/marketplace/create/vehicle'
                : payload.listingType === 'housing'
                    ? 'https://www.facebook.com/marketplace/create/rental'
                    : 'https://www.facebook.com/marketplace/create/item';
            this.logger.log(`Navigating to ${createUrl}`);
            await page.goto(createUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            const url = page.url();
            if (url.includes('login') || url.includes('checkpoint')) {
                throw new Error('Facebook session expired. Please update your cookie in Settings.');
            }
            await this.delay(2000);
            if (payload.images?.length) {
                await this.uploadImages(page, payload.images);
            }
            await this.delay(1000);
            await this.fillField(page, 'Title', payload.title);
            await this.delay(500);
            await this.fillField(page, 'Price', String(payload.price));
            await this.delay(500);
            if (payload.location) {
                await this.fillField(page, 'Location', payload.location);
                await this.delay(1500);
                await this.selectFirstSuggestion(page);
            }
            if (payload.condition) {
                await this.selectDropdown(page, 'Condition', payload.condition);
                await this.delay(500);
            }
            if (payload.description) {
                await this.fillField(page, 'Description', payload.description);
                await this.delay(500);
            }
            await this.delay(1500);
            await this.clickPublish(page);
            await this.delay(3000);
            const finalUrl = page.url();
            this.logger.log(`Posted! URL: ${finalUrl}`);
            await browser.close();
            return finalUrl;
        }
        catch (err) {
            this.logger.error('Facebook posting failed:', err.message);
            const screenshotPath = `uploads/debug-${Date.now()}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => { });
            await browser.close();
            throw err;
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
            return cookieStr.split(';').map(pair => {
                const [name, ...rest] = pair.trim().split('=');
                return { name: name.trim(), value: rest.join('=').trim(), domain: '.facebook.com' };
            }).filter(c => c.name && c.value);
        }
    }
    async uploadImages(page, imagePaths) {
        try {
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
        }
        catch (e) {
            this.logger.warn('Image upload failed:', e.message);
        }
    }
    async fillField(page, label, value) {
        try {
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
        }
        catch (e) {
            this.logger.warn(`Failed to fill field "${label}": ${e.message}`);
        }
    }
    async selectDropdown(page, label, value) {
        try {
            const selectors = [`[aria-label="${label}"]`, `[aria-label*="${label}"]`];
            for (const sel of selectors) {
                const el = await page.$(sel);
                if (el) {
                    await el.click();
                    await this.delay(500);
                    const option = await page.$x(`//span[contains(text(), "${value}")]`);
                    if (option.length) {
                        await option[0].click();
                        return;
                    }
                }
            }
        }
        catch (e) {
            this.logger.warn(`Failed to select dropdown "${label}": ${e.message}`);
        }
    }
    async selectFirstSuggestion(page) {
        try {
            await this.delay(1000);
            const suggestion = await page.$('[role="option"]');
            if (suggestion)
                await suggestion.click();
        }
        catch { }
    }
    async clickPublish(page) {
        const labels = ['Publish', 'Next', 'Post'];
        for (const label of labels) {
            try {
                const btns = await page.$x(`//div[@role="button" and .//span[text()="${label}"]]`);
                if (btns.length) {
                    await btns[0].click();
                    this.logger.log(`Clicked "${label}" button`);
                    return;
                }
            }
            catch { }
        }
        this.logger.warn('Could not find Publish/Next button');
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