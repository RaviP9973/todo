const { Builder, By, until } = require("selenium-webdriver");
const { BASE_URL, TEST_PHONE } = require("../config");

async function testLogin() {
  let driver = await new Builder().forBrowser("chrome").build();
  
  try {
    // Navigate to login page
    await driver.get(`${BASE_URL}/login`);
    
    // Find phone input and enter number
    const phoneInput = await driver.findElement(
      By.xpath("//input[@type='number' and @placeholder='Phone Number']")
    );
    await phoneInput.sendKeys("9973316633");
    
    // Click send OTP button
const sendOTPButton = await driver.wait(
      until.elementLocated(By.xpath("//button[text()='Send OTP' and not(@disabled)]")),
      10000,
      'Send OTP button did not become enabled after entering phone number'
    );
    await sendOTPButton.click();
    
    // Wait for OTP input to appear
    const otpInput = await driver.wait(
      until.elementLocated(By.xpath("//input[@placeholder='Enter OTP']")),
      10000
    );
    
    // Test case completed
    console.log("Login test completed successfully");
    
  } catch (error) {
    console.error("Login test failed:", error);
  } finally {
    await driver.quit();
  }
}

testLogin();