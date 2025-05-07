// utils/jira.js
require('dotenv').config();
const axios = require('axios');

const authHeader = {
  headers: {
    Authorization:
      'Basic ' +
      Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64'),
  },
};

async function getActiveSprintId(boardId) {
  const res = await axios.get(`${process.env.JIRA_BASE_URL}/rest/agile/1.0/board/${boardId}/sprint`, authHeader);
  const activeSprint = res.data.values.find(s => s.state === 'active');
  return activeSprint?.id;
}

async function getSprintIssues(sprintId) {
  const res = await axios.get(`${process.env.JIRA_BASE_URL}/rest/agile/1.0/sprint/${sprintId}/issue`, authHeader);
  return res.data.issues;
}

function getStatusEmoji(status) {
  if (status.includes('In Progress')) return '🔵';
  if (status.includes('Awaiting Approval')) return '🟡';
  if (status.includes('Done')) return '🟢';
  return '❔';
}

module.exports = {
  getActiveSprintId,
  getSprintIssues,
  getStatusEmoji
};
