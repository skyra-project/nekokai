import { T } from '@skyra/http-framework-i18n';

export * as Anime from '#lib/i18n/LanguageKeys/Commands/Kitsu/Anime';
export * as Manga from '#lib/i18n/LanguageKeys/Commands/Kitsu/Manga';

export const SubcommandName = T('commands/kitsu:subcommandName');
export const EmbedTitles = T<{
	romajiName: string;
	englishName: string;
	nativeName: string;
	type: string;
	score: string;
	episodes: string;
	episodeLength: string;
	chapters: string;
	volumes: string;
	ageRating: string;
	firstAirDate: string;
	watchIt: string;
	stillAiring: string;
	firstPublishDate: string;
	readIt: string;
}>('commands/kitsu:embedTitles');

export const Types = T<{
	movie: string;
	music: string;
	ona: string;
	ova: string;
	special: string;
	tv: string;
	doujin: string;
	manga: string;
	manhua: string;
	manhwa: string;
	novel: string;
	oel: string;
	oneshot: string;
	[index: string]: string;
}>('commands/kitsu:types');
