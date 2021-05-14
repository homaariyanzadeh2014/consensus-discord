import {
	CategoryChannel,
	Channel,
	Client,
	Guild,
	Snowflake,
	Permissions,
	TextChannel,
	User,
	Message,
	SystemChannelFlags,
} from "discord.js";

const CATEGORY = process.env.CATEGORY;

class ConsensusManager {
	private consensusSet: Set<Consensus>;

	constructor() {
		this.consensusSet = new Set<Consensus>();
	}

	public async createConsensus(
		title: string,
		creator: User,
		guild: Guild
	): Promise<Consensus> {
		const consensus = new Consensus(guild, undefined, title);
		await consensus.start(creator);

		this.consensusSet.add(consensus);

		return consensus;
	}

	public parseConsensus(channel: TextChannel): Consensus {
		const consensus = new Consensus(channel.guild, channel, undefined);

		return consensus;
	}

	public async load(guild: Guild) {
		const categoryChannel = guild.channels.cache.get(
			CATEGORY!!
		) as CategoryChannel;

		categoryChannel.children.forEach(async (child) => {
			if (!child.isText()) return;

			console.log(`Parsing #${child.name} channel`);

			const consensus = this.parseConsensus(child as TextChannel);

			const messages = await child.messages.fetch({
				limit: 100,
			});

			Array.from(messages.values())
				.reverse()
				.forEach(async (msg) => {
					if (msg.author.id === guild.client.user!!.id) return;

					let v = 0;
					if (msg.content.includes("👍")) v += 1;
					else if (msg.content.includes("👎")) v -= 1;

					if (v != 0)
						await consensus.vote(
							msg,
							v == 1 ? Vote.UPVOTE : Vote.DOWNVOTE,
							false
						);
				});

			console.log(`Parsed #${child.name}`);

			this.consensusSet.add(consensus);
		});
	}

	public getFromChannelId(channelId: Snowflake): Consensus | undefined {
		let ret: Consensus | undefined = undefined;

		this.consensusSet.forEach((c) => {
			if (ret != undefined) {
				return;
			}

			const chan = c.getChannel();
			if (chan != undefined && chan.id == channelId) {
				ret = c;
			}
		});

		return ret;
	}
}

export const CONSENSUS_MANAGER = new ConsensusManager();

export enum Vote {
	UPVOTE,
	DOWNVOTE,
}

export class Consensus {
	private title?: string;
	private votes: Map<Snowflake, Vote>;

	private locked: boolean;

	private guild: Guild;
	private channel?: TextChannel;

	constructor(guild: Guild, channel?: TextChannel, title?: string) {
		this.votes = new Map<Snowflake, Vote>();

		if (channel !== undefined) {
			this.locked = !channel
				.permissionsFor(guild.roles.everyone)
				.has(Permissions.FLAGS.VIEW_CHANNEL);
		} else this.locked = true;

		this.title = title;
		this.guild = guild;
		this.channel = channel;
	}

	async start(creator: User) {
		await this.createChannel(creator);
		await this.informCreator(creator);
	}

	public async vote(msg: Message, vote: Vote, reply: boolean = true) {
		if (this.votes.get(msg.author.id) == vote) return;

		this.votes.set(msg.author.id, vote);

		let upvotes = 0,
			downvotes = 0;
		this.votes.forEach((vote) => {
			if (vote == Vote.UPVOTE) upvotes += 1;
			else if (vote == Vote.DOWNVOTE) downvotes += 1;
		});

		if (reply)
			await msg.reply(
				`${upvotes} 👍                    ${downvotes} 👎`
					.replaceAll("0", "0️⃣")
					.replaceAll("1", "1️⃣")
					.replaceAll("2", "2️⃣")
					.replaceAll("3", "3️⃣")
					.replaceAll("4", "4️⃣")
					.replaceAll("5", "5️⃣")
					.replaceAll("6", "6️⃣")
					.replaceAll("7", "7️⃣")
					.replaceAll("8", "8️⃣")
					.replaceAll("9", "9️⃣")
			);
	}

	public async unlock() {
		const messages = await this.channel?.messages.fetch({
			limit: 100,
		});
		Array.from(messages!!.values())
			.reverse()
			.forEach(async (msg) => {
				if (msg.author.id !== this.guild.client.user!!.id) return;
				await msg.delete();
			});

		await this.channel?.updateOverwrite(this.guild.roles.everyone, {
			VIEW_CHANNEL: true,
			SEND_MESSAGES: true,
		});
		this.locked = false;
	}

	public async rename(name: string) {
		await this.channel?.setName(name);
	}

	private async informCreator(creator: User) {
		await this.channel?.send(
			`Konsensüs kanalı oluşturuldu ${creator.toString()}. Fakat bu kanalı şu anda sadece sen görebilirsin.
				
Lütfen konsensüse ulaşılmasını istediğiniz şeyi detaylıca ve herkesin anlayabileceği bir şekilde yazın. Yazdıktan sonra herkesin konsensüse katılabilmesi için \`/aç\` komutunu kullanın.`
		);
	}

	private async createChannel(creator: User) {
		this.channel = (await this.guild.channels.create(
			this.getChannelName(),
			{
				reason: this.title,
				type: "text",
				parent: CATEGORY,
				position: 0,
			}
		)) as TextChannel;

		await this.channel.updateOverwrite(creator, {
			VIEW_CHANNEL: true,
			SEND_MESSAGES: true,
		});
	}

	public isLocked(): boolean {
		return this.locked;
	}

	public getChannel(): TextChannel {
		return this.channel!!;
	}

	public getChannelName(): string {
		return this.title!!.toLowerCase()
			.replaceAll("-", " ")
			.replaceAll(/[^a-zA-Z0-9 \pşüçöğı]+/g, "")
			.replaceAll(/\s+/g, "-")
			.replace(/^-*/, "")
			.replace(/\-*$/, "");
	}
}
