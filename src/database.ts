import JSDB from "@small-tech/jsdb";
import { Client, Snowflake } from "discord.js";
import { Consensus, Vote } from "./consensus";

// https://github.com/small-tech/jsdb#unsupported-data-types
// map and set unsupported

export type ConsensusVotes = { [index: string]: Vote };

export interface ConsensusObject {
	title: string;
	votes: ConsensusVotes;
	locked: boolean;

	creator: Snowflake;
	guild: Snowflake;
	channel?: Snowflake;
}

export class ConsensusDatabase {
	private db;

	constructor() {
		this.db = JSDB.open("data");
	}

	save(consensuses: Set<Consensus>) {
		const serialize: ConsensusObject[] = [];

		consensuses.forEach((consensus) => {
			serialize.push(consensus.serialize());
		});

		// TODO: diff this maybe?
		this.db.c = serialize;
	}

	async load(client: Client): Promise<Set<Consensus>> {
		const cset = new Set<Consensus>();

		for (const consensus of this.db.c) {
			const guild = client.guilds.resolve(consensus.guild)!!;
			const creator = (await guild?.members.fetch(consensus.creator))
				.user;

			// TODO: this is bad
			const cons = new Consensus(consensus.title, creator!!, guild);
			cset.add(cons);
		}

		return cset;
	}
}
