const { chromium } = require('playwright');
const path = require('path');

(async () => {
    try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        const filePath = 'file:///' + path.resolve('mcp-test.html').replace(/\\/g, '/');
        console.log('Opening:', filePath);
        await page.goto(filePath);
        const title = await page.title();
        console.log('Title on page:', title);
        const heading = await page.textContent('h1');
        console.log('Heading on page:', heading);
        await browser.close();
        console.log('SUCCESS');
    } catch (e) {
        console.error('ERROR:', e.message);
        process.exit(1);
    }
})();
