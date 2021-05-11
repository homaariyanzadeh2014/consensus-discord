import {
	Client,
	Guild,
	GuildChannel,
	Snowflake,
	TextChannel,
	User,
} from "discord.js";

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
		const consensus = new Consensus(title, creator, guild);
		await consensus.start();

		this.consensusSet.add(consensus);
		return consensus;
	}
}

export const CONSENSUS_MANAGER = new ConsensusManager();

export enum Vote {
	UPVOTE,
	DOWNVOTE,
	ABSTAIN,
}

const CATEGORY = process.env.CATEGORY;

export class Consensus {
	private title: string;
	private creator: User;
	private votes: Map<Snowflake, Vote>;

	private locked: boolean;

	private guild: Guild;
	private channel?: TextChannel;

	constructor(title: string, creator: User, guild: Guild) {
		this.title = title;
		this.creator = creator;
		this.votes = new Map<Snowflake, Vote>();

		this.locked = true;

		this.guild = guild;
	}

	async start() {
		await this.createChannel();
		await this.informCreator();
	}

	public vote(member: Snowflake, vote: Vote) {
		this.votes.set(member, vote);
	}

	public async unlock() {
		await this.channel?.updateOverwrite(this.guild.roles.everyone, {
			VIEW_CHANNEL: true,
		});
		this.locked = false;
	}

	public async rename(name: string) {
		await this.channel?.setName(name);
	}

	private async informCreator() {
		await this.channel?.send(
			"Konsensüs kanalı oluşturuldu " +
				this.creator.toString() +
				". Fakat bu kanalı şu anda sadece sen görebilirsin." +
				"\n\nLütfen konsensüse ulaşılmasını istediğiniz şeyi detaylıca ve herkesin anlayabileceği bir şekilde yazın. Yazdıktan sonra herkesin konsensüse katılabilmesi için `/aç` komutunu kullanın."
		);
	}

	private async createChannel() {
		this.channel = (await this.guild.channels.create(
			this.getChannelName(),
			{
				reason: this.title,
				type: "text",
				parent: CATEGORY,
				position: 0,
			}
		)) as TextChannel;

		await this.channel.updateOverwrite(this.creator, {
			VIEW_CHANNEL: true,
		});
	}

	public isLocked(): boolean {
		return this.locked;
	}

	public getChannel(): TextChannel {
		return this.channel!!;
	}

	public getChannelName(): string {
		return this.title
			.toLowerCase()
			.replaceAll("-", " ")
			.replaceAll(/[^a-zA-Z0-9 \pşüçöğı]+/g, "")
			.replaceAll(/\s+/g, "-")
			.replace(/^-*/, "")
			.replace(/\-*$/, "");
	}
}
