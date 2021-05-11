import { Client, Intents } from "discord.js";

class Bot {
	private client: Client;

	constructor() {
		this.client = new Client({
			intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
		});

		this.client.on("ready", () => this.ready());
	}

	public start() {
		this.client.login(process.env.TOKEN);
	}

	private ready() {
		console.log(`Bot ready as ${this.client.user?.tag}`);
	}
}

const bot = new Bot();
bot.start();
