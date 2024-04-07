const axios = require('axios');

async function sendRequests() {
  const endpoint = 'http://localhost:9000'; 
  const concurrency = 30000; 
  const numRequests = 1000; 

  const requestPromises = [];

  for (let i = 0; i < concurrency; i++) {
    requestPromises.push(sendRequest(endpoint));
  }

  await Promise.all(requestPromises);

  console.log('Load test complete');
}

async function sendRequest(endpoint) {
  try {
    const response = await axios.get(endpoint);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

sendRequests();
