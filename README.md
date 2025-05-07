# Discord x Jira Bot - Full Deployment & Usage Documentation

This bot automatically syncs Jira sprint issues with Discord threads, renames threads based on issue status, and adds a specified user to each thread. It also supports a `/clear` command to delete all created threads and auto-refreshes periodically.

---

## Features
- Creates a thread in a specific Discord channel for every issue in the active Jira sprint
- Renames threads based on issue status using emojis
- Adds a specific user (e.g., `lodriscoll33`) to each created thread
- Supports a slash command `/clear` to remove all bot-created threads
- Automatically re-syncs with Jira every 15 seconds

---

## Requirements
- Node.js (v18+ recommended)
- npm
- A Discord bot token
- Jira Cloud account with API token
- EC2 instance (or local machine) to run the bot

---

## Setup Instructions

### 1. Clone or Upload the Bot
```bash
scp -i your-key.pem discord-jira-bot.zip ubuntu@your-ec2-ip:/home/ubuntu/
ssh -i your-key.pem ubuntu@your-ec2-ip
unzip discord-jira-bot.zip
cd discord-jira-bot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create `.env` File
```env
DISCORD_TOKEN=your_bot_token
DISCORD_CHANNEL_ID=channel_id_where_threads_go
JIRA_BASE_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=your_email@domain.com
JIRA_API_TOKEN=your_jira_api_token
JIRA_BOARD_ID=your_board_id (e.g., 67)
```

### 4. Run the Bot (Development)
```bash
node index.js
```

### 5. Keep Bot Running with pm2 (Recommended)
```bash
npm install pm2   # or sudo npm install -g pm2 if allowed
npx pm2 start index.js --name discord-jira-bot
npx pm2 save
npx pm2 startup
```
Follow any instructions pm2 gives you after running `startup`.

To check status:
```bash
npx pm2 list
npx pm2 logs discord-jira-bot
```

---

### Periodic Sync
- The bot re-syncs every **15 seconds**
- Thread titles are updated if issue statuses change

---

## If You Need to Change Servers
1. Invite the bot to the new Discord server
2. Update `.env` with the new `DISCORD_CHANNEL_ID`
3. Restart the bot:
```bash
npx pm2 restart discord-jira-bot
```

---

## Troubleshooting
- `Command 'pm2' not found`: use `npx pm2` instead
- Threads not updating: make sure statuses in Jira match exactly (e.g., `"Testing/Review"`)
- Not being added to threads: ensure `lodriscoll33` exists in the server and is spelled correctly
- Emoji not rendering: use standard Unicode emojis, not Discord shortcodes

---

## Cleaning Up
To completely stop the bot and remove it from pm2:
```bash
npx pm2 stop discord-jira-bot
npx pm2 delete discord-jira-bot
```

## You're Done!
Your Discord x Jira bot is now:
- Automated
- Monitored
- Continuously syncing
- And fully deployed on AWS EC2

Let me know if you want to add support for multiple servers, multiple users, or status-based notifications! 🚀
