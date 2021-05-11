import { Client, Intents } from "discord.js";

class Bot {
	private client: Client;

	constructor() {
		this.client = new Client({
			intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
		});

		this.client.on("ready", async () => await this.ready());
	}

	public start() {
		this.client.login(process.env.TOKEN);
	}

	private async ready() {
		const guildId = process.env.GUILD;

		if (guildId === undefined) {
			console.error("Missing environment variable GUILD=''");
			return;
		}

		const guild = this.client.guilds.cache.get(guildId);

		if (guild === undefined) {
			console.error("Invalid guild ID!");
			return;
		}

		console.log(`Creating slash command for guild ${guild.name}`);
		await guild.commands.create({
			name: "konsensüs",
			description: "Yeni konsensüs başlatır",
			options: [
				{
					name: "baslik",
					type: "STRING",
					description: "Konsensüs başlığı",
					required: true,
				},
			],
		});

		console.log(`Bot ready as ${this.client.user?.tag}`);
	}
}

const bot = new Bot();
bot.start();
