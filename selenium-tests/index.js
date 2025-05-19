const { spawn } = require('child_process');

const tests = [
  'testLogin.js',
  'testCreateTodo.js',
  'testDeleteTodo.js',
//   'testNotifications.js'
];

async function runTests() {
  for (const test of tests) {
    console.log(`\nRunning ${test}...`);
    
    try {
      await new Promise((resolve, reject) => {
        const proc = spawn('node', [`TestCases/${test}`]);
        
        proc.stdout.on('data', (data) => {
          console.log(data.toString());
        });
        
        proc.stderr.on('data', (data) => {
          console.error(data.toString());
        });
        
        proc.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Test failed with code ${code}`));
          }
        });
      });
    } catch (error) {
      console.error(`Error running ${test}:`, error);
    }
  }
}

runTests();