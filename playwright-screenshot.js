const { chromium } = require('playwright');
const path = require('path');

(async () => {
    try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage({ viewport: { width: 1280, height: 1800 } });
        const filePath = 'file:///' + path.resolve('project-info.html').replace(/\\/g, '/');
        console.log('Opening:', filePath);
        await page.goto(filePath);
        // Wait a bit for fonts to load
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'project-info-screenshot.png', fullPage: true });
        console.log('Screenshot saved as project-info-screenshot.png');
        await browser.close();
    } catch (e) {
        console.error('ERROR:', e.message);
        process.exit(1);
    }
})();
