# Discord x Jira Bot

This bot automatically syncs Jira sprint issues with Discord threads, renames threads based on issue status, and adds a specified user to each thread.

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

### 5. Keep Bot Running with pm2 on AWS (Recommended) also can run locally or on Raspberry Pi
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

## Setup
1. Invite the bot to the new Discord server
2. Update `.env` with the new `DISCORD_CHANNEL_ID`
3. Restart the bot:
```bash
npx pm2 restart discord-jira-bot
```

## Cleaning Up
To completely stop the bot and remove it from pm2:
```bash
npx pm2 stop discord-jira-bot
npx pm2 delete discord-jira-bot
```
---
## Known Issues:

- Bot can make duplicates when you start a new sprint while the bot is still running.
- Long Story names causes bot to brick since the name of a thread is limited
- Jira sometimes has trouble with API calls on boards that aren't your's, but you can have Jira make a copy of the board, sync it with the main one, and run requests through that.
---
