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
  gamestop: {
    email: '',
    password: '',
    cvv: ''
  },
  newegg: {
    email: '',
    password: ''
  }
}

export async function checkout(store: Store, givenUrl: string) {
  puppeteer
  .use(StealthPlugin())
  .launch({ 
    headless: process.env.HEADLESS == 'true' ? true : false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ]
  })
  .then(async browser => {
    const page = await browser.newPage()
    await page.goto(givenUrl, {waitUntil: 'networkidle0'})
    
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
        await page.waitForSelector('input[name=add]')
        await page.click('input[name=add]')
        await page.waitForSelector('input[name=proceedToRetailCheckout]')
        await page.click('input[name=proceedToRetailCheckout]')
        await page.waitForSelector('#ap_email')
        await page.type('#ap_email', login.amazon.email)
        await page.click('#continue')
        await page.waitForSelector('#ap_password')
        await page.type('#ap_password', login.amazon.password)
        await page.click('#signInSubmit')
        await page.waitForSelector('.a-button-text.place-your-order-button')
        await page.click('.a-button-text.place-your-order-button')
      } else if (store.name == 'gamestop') {
        await page.waitForSelector('.primary-details-row .add-to-cart')
        await page.click('.primary-details-row .add-to-cart')
        await page.waitForTimeout(1000)
        await page.waitForSelector('.modal-content a[title="View Cart"]')
        await page.click('.modal-content a[title="View Cart"]')
        const checkout = await Promise.race([
          page.waitForSelector('a[class="mb-2 mx-0 btn btn-primary btn-block checkout-btn "]', {timeout: 2000, visible: true}),
          page.waitForSelector('a[class="mb-2 mx-0 btn btn-primary btn-block checkout-btn-header "]', {timeout: 2000, visible: true}),
        ])
        await checkout?.click()
        await page.waitForSelector('#login-form-email')
        await page.type('#login-form-email', login.gamestop.email)
        await page.type('#login-form-password', login.gamestop.password)
        await page.click('#signinCheck button[type=submit]')
        await page.waitForSelector('.row.no-gutters.next-step-button.justify-content-center.workflow-button .btn.btn-primary.btn-block.submit-shipping')
        await page.click('.row.no-gutters.next-step-button.justify-content-center.workflow-button .btn.btn-primary.btn-block.submit-shipping')
        await page.waitForNavigation()
        await page.waitForSelector('label[for="saved-payment-security-code"]')
        await page.click('label[for="saved-payment-security-code"]')
        // await page.keyboard.type(login.gamestop.cvv, {delay: 100})
        
        // await page.click('.row.no-gutters.order-summary.justify-content-end button[value=submit-payment]')
        // await page.waitForSelector('.row.no-gutters.order-summary.justify-content-end button[value="place-order"]')
        // await page.click('.row.no-gutters.order-summary.justify-content-end button[value="place-order"]')
      } else if(store.name == 'newegg') {

      }

      await page.waitForTimeout(5000)
      await page.screenshot({ path: `screenshots/${store.name}-${Date.now()}.png`, fullPage: true })
      await browser.close()
    } catch (err) {
      console.log(err)
      await page.waitForTimeout(5000)
      await page.screenshot({ path: `screenshots/err-${Date.now()}.png`, fullPage: true })
    }
  })
}