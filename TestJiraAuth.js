require('dotenv').config();
const axios = require('axios');

const authHeader = {
  headers: {
    Authorization:
      'Basic ' +
      Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64'),
  },
};

async function testAuth() {
  try {
    const response = await axios.get(`${process.env.JIRA_BASE_URL}/rest/agile/1.0/board`, authHeader);
    console.log('✅ Jira Auth Successful! Boards:\n');
    response.data.values.forEach(board => {
      console.log(`- ${board.name} (ID: ${board.id}, Type: ${board.type})`);
    });
  } catch (err) {
    if (err.response) {
      console.error('❌ Jira API Error:\n', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('❌ Request Error:\n', err.message);
    }
  }
}

testAuth();
