import { T } from '@skyra/http-framework-i18n';

export * as Anime from '#lib/i18n/LanguageKeys/Commands/AniList/Anime';
export * as Manga from '#lib/i18n/LanguageKeys/Commands/AniList/Manga';

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

export const MediaFormatManga = T('commands/anilist:mediaFormatManga');
export const MediaFormatMovie = T('commands/anilist:mediaFormatMovie');
export const MediaFormatMusic = T('commands/anilist:mediaFormatMusic');
export const MediaFormatNovel = T('commands/anilist:mediaFormatNovel');
export const MediaFormatOriginalNetAnimation = T('commands/anilist:mediaFormatOriginalNetAnimation');
export const MediaFormatOneShot = T('commands/anilist:mediaFormatOneShot');
export const MediaFormatOriginalVideoAnimation = T('commands/anilist:mediaFormatOriginalVideoAnimation');
export const MediaFormatSpecial = T('commands/anilist:mediaFormatSpecial');
export const MediaFormatTV = T('commands/anilist:mediaFormatTV');
export const MediaFormatTVShort = T('commands/anilist:mediaFormatTVShort');

export const Unknown = T('commands/anilist:unknown');

export const CountryChina = T('commands/anilist:countryChina');
export const CountryJapan = T('commands/anilist:countryJapan');
export const CountryKorea = T('commands/anilist:countryKorea');
export const CountryTaiwan = T('commands/anilist:countryTaiwan');
