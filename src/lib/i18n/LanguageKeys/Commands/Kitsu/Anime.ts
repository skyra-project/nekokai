import { FT, T } from '@skyra/http-framework-i18n';

export const RootDescription = T('commands/kitsu:animeDescription');

export const EmbedData = T<{
	type: string;
	score: string;
	episodes: string;
	episodeLength: string;
	ageRating: string;
	firstAirDate: string;
	watchIt: string;
	stillAiring: string;
}>('commands/kitsu:animeEmbedData');

export const OutputDescription = FT<{ englishTitle: string; japaneseTitle: string; canonicalTitle: string; synopsis: string }, string>(
	'commands/kitsu:animeOutputDescription'
);

export const Types = T<{ tv: string; movie: string; ova: string; special: string; [index: string]: string }>('commands/kitsu:animeTypes');
