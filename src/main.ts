import { Client, Intents, Interaction } from "discord.js";

require("dotenv").config();

class Bot {
	private client: Client;

	constructor() {
		this.client = new Client({
			intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
		});

		this.client.on("ready", async () => await this.ready());
		this.client.on(
			"interaction",
			async (interaction) => await this.interaction(interaction)
		);
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

	private async interaction(interaction: Interaction) {
		if (!interaction.isCommand()) {
			// Not a slash command
			return;
		}

		if (interaction.commandName !== "konsensüs") {
			// Not /konsensüs
			return;
		}

		const title = interaction.options[0].value;
		await interaction.reply(
			`biraz bekle daha bitmedim ben ama bi ara '${title}' açarım`
		);
	}
}

console.log("==== Konsensüs Bot ====");
const bot = new Bot();
bot.start();
