const { firefox } = require('playwright');
require('dotenv').config();

let browser;
let page;

async function initBrowser() {
  browser = await firefox.launch({ 
    headless: false,
    executablePath: process.env.FIREFOX_PATH,
    args: [
      '--disable-gpu', // Disable GPU acceleration
      '--disable-software-rasterizer',
      '--no-sandbox'
    ],
    firefoxUserPrefs: {
      'layers.acceleration.disabled': true,
      'gfx.direct3d11.reuse-decoder-device': false
    }
  });
  page = await browser.newPage();
}

async function login() {
  await page.goto('https://agents.ichancy.com/login');
  await page.fill(process.env.USERNAME_SELECTOR, process.env.WEBSITE_ADMIN_USERNAME);
  await page.fill(process.env.PASSWORD_SELECTOR, process.env.WEBSITE_ADMIN_PASSWORD);
  await page.click(process.env.LOGIN_BTN_SELECTOR);
  await page.waitForTimeout(20000);
}

// Keep other functions (createUser, updateBalance) similar but update selectors

module.exports = { initBrowser, login };
async function createUser(username, password) {
  try {
    await page.click('.bc-icon-add-user');
    await page.waitForSelector('.error-color > div:nth-child(1) > label:nth-child(1) > div:nth-child(1) > input:nth-child(1)');
    
    // Fill user details
    await page.type('.error-color > div:nth-child(1) > label:nth-child(1) > div:nth-child(1) > input:nth-child(1)', username);
    await page.type('.t-password > div:nth-child(1) > label:nth-child(1) > div:nth-child(1) > input:nth-child(1)', password);
    await page.click('button.s-medium:nth-child(2)');
    await page.waitForTimeout(5000);
    
    return true;
  } catch (error) {
    console.error('Error creating user:', error);
    return false;
  }
}

async function updateBalance(username, amount, type) {
  try {
    await page.click('.bc-icon-transfer-bold');
    await page.waitForTimeout(1000);
    
    // Select transaction type
    const selector = type === 'topup' 
      ? 'div.crs-holder:nth-child(1) > div:nth-child(1) > div:nth-child(1) > label:nth-child(1)'
      : 'div.crs-holder:nth-child(2) > div:nth-child(1) > div:nth-child(1) > label:nth-child(1)';
    
    await page.click(selector);
    
    // Fill transaction details
    await page.type('.error-color > div:nth-child(1) > label:nth-child(1) > div:nth-child(1) > input:nth-child(1)', username);
    await page.type('input.placeholder', amount.toString());
    await page.click('button.s-medium:nth-child(2) > span:nth-child(1)');
    await page.waitForTimeout(5000);
    
    return true;
  } catch (error) {
    console.error('Error updating balance:', error);
    return false;
  }
}

module.exports = { initBrowser, login, createUser, updateBalance };