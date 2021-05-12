import { Client, Snowflake } from "discord.js";
import { Consensus, Vote } from "./consensus";
import { promises as fs } from "fs";

const DATA_PATH = "data/consensus.json";

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
	async save(consensuses: Set<Consensus>) {
		const serialize: ConsensusObject[] = [];

		consensuses.forEach((consensus) => {
			serialize.push(consensus.serialize());
		});

		const json = JSON.stringify(serialize);
		await fs.writeFile(DATA_PATH, json);
	}

	async load(client: Client): Promise<Set<Consensus>> {
		const cset = new Set<Consensus>();
		let db: ConsensusObject[] | undefined;

		try {
			const file = await fs.readFile(DATA_PATH);
			db = JSON.parse(file.toString());
		} catch (e) {
			if (e.code == "ENOENT") {
				console.warn(
					"Error reading consensus data. Is it the first time you're starting the bot? Returning empty just in case!"
				);
			} else {
				console.error("Error reading consensus data!");
				throw e;
			}
		}

		if (db === undefined) {
			return cset;
		}

		for (const consensus of db) {
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
