const { Builder, By, until } = require("selenium-webdriver");
const { BASE_URL } = require("../config");

async function testDeleteTodo() {
  let driver = await new Builder().forBrowser("chrome").build();
  
  try {
    // Navigate to main page
    await driver.get(BASE_URL);
    
    // Find first todo delete button
    const deleteButton = await driver.findElement(
      By.xpath("//button[contains(@class, 'delete') or contains(@class, 'trash')]")
    );
    
    // Store todo text for verification
    const todoElement = await driver.findElement(
      By.xpath("//div[contains(@class, 'todo-item')]")
    );
    const todoText = await todoElement.getText();
    
    // Click delete
    await deleteButton.click();
    
    // Verify todo was deleted
    await driver.wait(
      until.stalenessOf(todoElement),
      5000
    );
    
    console.log("Delete todo test completed successfully");
    
  } catch (error) {
    console.error("Delete todo test failed:", error);
  } finally {
    await driver.quit();
  }
}

testDeleteTodo();