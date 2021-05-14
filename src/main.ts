require("dotenv").config();

import {
	Client,
	CommandInteraction,
	IntegrationApplication,
	Intents,
	Interaction,
	Message,
	SystemChannelFlags,
} from "discord.js";

import { CONSENSUS_MANAGER, Vote } from "./consensus";

class Bot {
	private client: Client;

	constructor() {
		this.client = new Client({
			intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
		});

		this.client.on("ready", async () => await this.ready());
		this.client.on("message", async (msg) => await this.message(msg));
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
		await CONSENSUS_MANAGER.load(guild);

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

	private async message(msg: Message) {
		if (msg.author.id === this.client.user!!.id) return;

		const consensus = CONSENSUS_MANAGER.getFromChannelId(msg.channel.id);
		if (consensus === undefined) return;

		let v = 0;
		if (msg.content.includes("👍")) v += 1;
		else if (msg.content.includes("👎")) v -= 1;

		if (v != 0)
			await consensus.vote(
				msg,
				v == 1 ? Vote.UPVOTE : Vote.DOWNVOTE,
				true
			);
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

		if (consensus.isLocked()) {
			await interaction.reply("Konsensüs herkese açılmıştır.");
			await consensus.unlock();
		} else {
			await interaction.reply(
				"Bu konsensüs zaten herkese açık durumdadır."
			);
		}
	}
}

console.log("==== Konsensüs Bot ====");
const bot = new Bot();
bot.start();
