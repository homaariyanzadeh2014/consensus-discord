require("dotenv").config();

import { Client, CommandInteraction, Intents, Interaction } from "discord.js";
import { CONSENSUS_MANAGER } from "./consensus";

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
			console.error("Missing environment variable GUILD");
			return;
		}

		const guild = this.client.guilds.cache.get(guildId);

		if (guild === undefined) {
			console.error("Invalid guild ID!");
			return;
		}

		console.log("Loading saved consensus data");
		await CONSENSUS_MANAGER.load(this.client);

		console.log(`Creating slash commands for guild ${guild.name}`);
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

		await guild.commands.create({
			name: "aç",
			description: "Konsensüs kanalını herkese açar",
		});

		console.log(`Bot ready as ${this.client.user?.tag}`);
	}

	private async interaction(interaction: Interaction) {
		if (!interaction.isCommand()) {
			// Not a slash command
			return;
		}

		if (interaction.commandName == "konsensüs") {
			this.consensusCommand(interaction);
		} else if (interaction.commandName == "aç") {
			this.unlockCommand(interaction);
		}
	}

	private async consensusCommand(interaction: CommandInteraction) {
		const title = interaction.options[0].value;
		const consensus = await CONSENSUS_MANAGER.createConsensus(
			title as string,
			interaction.member,
			interaction.guild!!
		);

		await interaction.reply(
			`Konsensüs kanalı ${consensus.getChannel().toString()} oluşturuldu.`
		);
	}

	private async unlockCommand(interaction: CommandInteraction) {
		const consensus = CONSENSUS_MANAGER.getFromChannelId(
			interaction.channelID!!
		);

		if (consensus === undefined) {
			await interaction.reply(
				`Bu komut sadece konsensüs kanallarında çalışır.`
			);
			return;
		}

		await consensus.unlock();
		await interaction.reply(`Konsensüs herkese açılmıştır.`);
	}
}

console.log("==== Konsensüs Bot ====");
const bot = new Bot();
bot.start();
