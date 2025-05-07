require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers],
});

const THREAD_DB_PATH = './data/threads.json';
function loadThreadMap() {
  try {
    return JSON.parse(fs.readFileSync(THREAD_DB_PATH));
  } catch {
    return {};
  }
}
function saveThreadMap(data) {
  fs.writeFileSync(THREAD_DB_PATH, JSON.stringify(data, null, 2));
}

// Jira API auth
const authHeader = {
  headers: {
    Authorization:
      'Basic ' + Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64'),
  },
};

// Emoji mapping
function getStatusEmoji(status) {
  const s = status.trim().toLowerCase();
  if (s === 'to do') return '⏸️';
  if (s === 'in progress') return '🔵';
  if (s === 'blocked') return '⚠️';
  if (s === 'testing/review' || s === 'testing / review') return '❗';
  if (s === 'done') return '🟢';
  return '❔';
}

// Jira helpers
async function getActiveSprintId(boardId) {
  const res = await axios.get(`${process.env.JIRA_BASE_URL}/rest/agile/1.0/board/${boardId}/sprint`, authHeader);
  const sprints = res.data.values;
  if (!sprints || sprints.length === 0) return null;
  const activeSprint = sprints.find(s => s.state === 'active');
  return activeSprint?.id || null;
}

async function getSprintIssues(sprintId) {
  const res = await axios.get(`${process.env.JIRA_BASE_URL}/rest/agile/1.0/sprint/${sprintId}/issue`, authHeader);
  return res.data.issues;
}

// Main sync function
async function syncJiraToThreads() {
  const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
  const boardId = process.env.JIRA_BOARD_ID;
  const threadMap = loadThreadMap();
  const sprintId = await getActiveSprintId(boardId);
  if (!sprintId) return;

  const issues = await getSprintIssues(sprintId);
  for (const issue of issues) {
    const key = issue.key;
    const summary = issue.fields.summary;
    const status = issue.fields.status.name;
    const emoji = getStatusEmoji(status);
    const threadName = `${emoji} ${key}: ${summary}`;
    console.log(`🔍 [${key}] Status: "${status}" → Emoji: "${emoji}"`);

    let existingThread = null;

    // First check threadMap
    if (threadMap[key]) {
      try {
        existingThread = await channel.threads.fetch(threadMap[key]);
      } catch {
        console.log(`⚠️ Could not find thread ID in map for ${key}`);
      }
    }

    // Then check active threads by name
    if (!existingThread) {
      const activeThreads = await channel.threads.fetchActive();
      existingThread = activeThreads.threads.find(t => t.name.includes(key));
    }

    if (existingThread) {
      if (existingThread.name !== threadName) {
        await existingThread.setName(threadName);
        console.log(`✏️ Renamed thread for ${key}`);
      }
      threadMap[key] = existingThread.id;
    } else {
      // Create new thread
      if (channel.isTextBased() && channel.type === 0) {
        const msg = await channel.send(`Creating thread for **${key}**`);
        const newThread = await msg.startThread({
          name: threadName,
          autoArchiveDuration: 1440,
        });
        threadMap[key] = newThread.id;
        console.log(`🧵 Created thread: ${threadName}`);

        // Add only you to the thread
        // TODO:  You (bot owner) should add yourself to the thread being created, that way you can keep track
        try {
          const members = await channel.guild.members.fetch();
          const user = members.find(m => m.user.username === 'CHANGEME' && !m.user.bot);
          if (user) {
            await newThread.members.add(user.id);
            console.log(`👤 Added ${user.user.tag} (${user.id}) to thread`);
          }
        } catch (err) {
          console.error(`❌ Failed to add user to thread: ${err.message}`);
        }
      } else {
        console.log("⚠️ Channel is not a guild text channel — can't create thread.");
      }
    }
  }

  saveThreadMap(threadMap);
}

// On ready
client.on('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Register /clear command
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const commands = [
    new SlashCommandBuilder()
      .setName('clear')
      .setDescription('Deletes all bot-created threads in this channel')
      .toJSON(),
  ];
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Slash command /clear registered');
  } catch (err) {
    console.error('❌ Failed to register slash commands:', err);
  }

  // Start sync immediately
  await syncJiraToThreads();

  // Then refresh every 15 seconds
  setInterval(async () => {
    console.log('🔁 Refreshing Jira sprint issues...');
    await syncJiraToThreads();
  }, 15 * 1000);
});

// Slash command handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'clear') {
    await interaction.reply({ content: '🧹 Deleting all bot-created threads...', ephemeral: true });

    const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
    const threadMap = loadThreadMap();
    let deletedCount = 0;

    for (const [issueKey, threadId] of Object.entries(threadMap)) {
      try {
        const thread = await channel.threads.fetch(threadId);
        await thread.delete();
        deletedCount++;
        console.log(`🗑️ Deleted thread for ${issueKey}`);
      } catch {
        console.log(`⚠️ Could not delete thread ${issueKey}`);
      }
    }

    saveThreadMap({});
    await interaction.editReply(`✅ Deleted ${deletedCount} thread(s).`);
  }
});

client.login(process.env.DISCORD_TOKEN);
