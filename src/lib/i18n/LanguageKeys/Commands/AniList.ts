import { T } from '@skyra/http-framework-i18n';

export * as Anime from '#lib/i18n/LanguageKeys/Commands/AniList/Anime';
export * as Manga from '#lib/i18n/LanguageKeys/Commands/AniList/Manga';

export const SubcommandName = T('commands/anilist:subcommandName');
export const EmbedTitles = T<{
	countryOfOrigin: string;
	englishName: string;
	episodeLength: string;
	episodes: string;
	chapters: string;
	volumes: string;
	externalLinks: string;
	nativeName: string;
	romajiName: string;
}>('commands/anilist:embedTitles');

export const CountryChina = T('commands/anilist:countryChina');
export const CountryJapan = T('commands/anilist:countryJapan');
export const CountryKorea = T('commands/anilist:countryKorea');
export const CountryTaiwan = T('commands/anilist:countryTaiwan');
