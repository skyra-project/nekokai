import { anilistAnimeGet, anilistMangaGet, handleAniListResult } from '#lib/anilist';
import { InteractionHandler, type Interactions } from '@skyra/http-framework';

export class UserHandler extends InteractionHandler {
	public async run(interaction: Interactions.MessageComponentButton, parameters: Parameters) {
		const kind = parameters[0];
		const hideDescription = parameters[1];
		const id = Number(parameters[2]);

		const result = await (kind === 'anime' ? anilistAnimeGet : anilistMangaGet)(id);
		const response = handleAniListResult({
			interaction,
			result,
			kind,
			hideDescription: hideDescription === '1',
			hide: false
		});

		return interaction.reply(response);
	}
}

type Parameters = [kind: 'anime' | 'manga', hideDescription: '0' | '1', id: `${number}`];
