const { chromium } = require('playwright');
require('dotenv').config();

let browser;
let page;

const { chromium } = require('playwright');

async function initBrowser() {
  try {
    return await chromium.launch({
      headless: true,
      executablePath: '/opt/render/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process'
      ]
    });
  } catch (error) {
    console.error('Chromium launch error:', error);
    throw error;
  }
}

async function login() {
  try {
    await page.goto('https://agents.ichancy.com/login');
    
    // Login selectors from your .env
    await page.fill(process.env.USERNAME_SELECTOR, process.env.WEBSITE_ADMIN_USERNAME);
    await page.fill(process.env.PASSWORD_SELECTOR, process.env.WEBSITE_ADMIN_PASSWORD);
    await page.click(process.env.LOGIN_BTN_SELECTOR);
    
    await page.waitForTimeout(15000);
    console.log('Logged in successfully');
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
}

async function createUser(username, password) {
  try {
    await page.click('.bc-icon-add-user');
    await page.waitForLoadState('networkidle');
    
    await page.fill('.error-color > div > label > div > input', username);
    await page.fill('.t-password > div > label > div > input', password);
    await page.click('button.s-medium:nth-child(2)');
    
    await page.waitForTimeout(5000);
    return true;
  } catch (error) {
    console.error('User creation failed:', error);
    return false;
  }
}

async function updateBalance(username, amount, type) {
  try {
    await page.click('.bc-icon-transfer-bold');
    await page.waitForLoadState('networkidle');
    
    const selector = type === 'topup' 
      ? 'div.crs-holder:nth-child(1) label'
      : 'div.crs-holder:nth-child(2) label';
      
    await page.click(selector);
    await page.fill('.error-color > div > label > div > input', username);
    await page.fill('input.placeholder', amount.toString());
    await page.click('button.s-medium > span');
    
    await page.waitForTimeout(5000);
    return true;
  } catch (error) {
    console.error('Balance update failed:', error);
    return false;
  }
}

module.exports = { initBrowser, login, createUser, updateBalance };
