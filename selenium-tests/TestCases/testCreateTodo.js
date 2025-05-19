const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const { BASE_URL } = require("../config");

async function testCreateTodo() {
  const options = new chrome.Options();
  options.addArguments("--remote-debugging-port=9222");
  options.debuggerAddress("localhost:9222");

  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    // Navigate to main page (assuming already logged in)
    await driver.get(BASE_URL);

    // Click add todo button
    const addButton = await driver.findElement(
      By.xpath("//button[contains(text(), '+ New Task')]")
    );
    await addButton.click();

    // Wait for modal to appear
    await driver.wait(
      until.elementLocated(
        By.xpath("//div[contains(@class, 'addNewTaskModal')]")
      ),
      5000
    );

    // Fill todo details
    const titleInput = await driver.findElement(
      By.xpath("//input[@placeholder='Task title']")
    );
    await titleInput.sendKeys("Test Todo");

    const descInput = await driver.findElement(
      By.xpath("//textarea[@placeholder='Task description']")
    );
    await descInput.sendKeys("This is a test todo");

    const dueDateInput = await driver.findElement(
      By.xpath("//input[@type='date']")
    );
    const futureDate = "2025-05-18"; // You can modify this date as needed
    await driver.executeScript(
      `arguments[0].value = '${futureDate}';
       arguments[0].dispatchEvent(new Event('change'));`,
      dueDateInput
    );
    // Submit todo
    const submitButton = await driver.findElement(
      By.xpath("//button[text()='Add Todo']")
    );
    await submitButton.click();

    // Verify todo was created
    await driver.wait(
      until.elementLocated(By.xpath("//div[contains(text(), 'Test Todo')]")),
      5000
    );

    console.log("Create todo test completed successfully");
  } catch (error) {
    console.error("Create todo test failed:", error);
  } finally {
    await driver.quit();
  }
}

testCreateTodo();
