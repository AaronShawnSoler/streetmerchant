import { KeyInput } from 'puppeteer'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { Store } from './model'

const login = {
  amazon: {
    email: <string>process.env.AMAZON_EMAIL,
    password: <string>process.env.AMAZON_PASSWORD
  },
  adorama: {
    email: <string>process.env.ADORAMA_EMAIL,
    password: <string>process.env.ADORAMA_PASSWORD
  },
  newegg: {
    cvv: <string>process.env.NEWEGG_CVV
  }
}

export async function checkout(store: Store, givenUrl: string) {
  puppeteer
  .use(StealthPlugin())
  .launch({ 
    headless: process.env.HEADLESS == 'true' ? true : false,
    executablePath: 'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    userDataDir: './cookies',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ]
  })
  .then(async browser => {
    const pages = await browser.pages()
    const page = await pages[0]
    await page.goto(givenUrl, {waitUntil: 'networkidle2'})
    
    try {
      
      if(store.name == 'adorama') {
        await page.waitForSelector('.button.radius.add-to-cart.action.highlight-dark')
        await page.click('.button.radius.add-to-cart.action.highlight-dark')
        await page.waitForSelector('.button.highlight-dark.checkout-button')
        await page.click('.button.highlight-dark.checkout-button')
        await page.waitForSelector('#login-email')
        await page.type('#login-email', login.adorama.email)
        await page.type('#login-pwd', login.adorama.password)
        await page.click('button[type=submit].radius.small')
        await page.waitForSelector('a[data-action=placeOrder]')
        await page.click('a[data-action=placeOrder]')
      } else if (store.name == 'amazon') {
        await page.waitForSelector('input[name="add"]')
        await page.click('input[name="add"]')
        await page.waitForSelector('input[name="proceedToRetailCheckout"]')
        await page.click('input[name="proceedToRetailCheckout"]')
        await page.waitForSelector('input[name="placeYourOrder1"]')
        // await page.click('input[name="placeYourOrder1"]')
      } else if(store.name == 'newegg') {
        await page.waitForSelector('.form-cell button[data-dismiss="modal"]')
        await page.click('.form-cell button[data-dismiss="modal"]')
        await page.waitForSelector('input[title="Search Site"]')
        await page.click('input[title="Search Site"]')
        await page.click('button[class="btn btn-primary btn-wide"]')
        await page.waitForSelector('div[class="checkout-step-done"] input[class="form-text mask-cvv-4"]')
        await page.focus('div[class="checkout-step-done"] input[class="form-text mask-cvv-4"]')
        await page.waitForTimeout(500)
        await page.keyboard.press(<KeyInput>login.newegg.cvv[0])
        await page.keyboard.press('ArrowLeft')
        await page.keyboard.press('ArrowLeft')
        await page.keyboard.press('ArrowLeft')
        await page.keyboard.press(<KeyInput>login.newegg.cvv[1])
        await page.keyboard.press('ArrowLeft')
        await page.keyboard.press(<KeyInput>login.newegg.cvv[2])
        // await page.click('button#btnCreditCard')
      }

      await page.waitForTimeout(5000)
      await page.screenshot({ path: `screenshots/${store.name}-${Date.now()}.png`, fullPage: true })
      await page.close()
      // await browser.close()
    } catch (err) {
      console.log(err)
      await page.waitForTimeout(5000)
      await page.screenshot({ path: `screenshots/err-${Date.now()}.png`, fullPage: true })
    }
  })
}