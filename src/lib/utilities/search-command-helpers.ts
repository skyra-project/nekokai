import type { AniListResponse } from '#lib/apis/anilist/anilist-constants';
import type { Kitsu } from '#lib/apis/kitsu/Kitsu';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { apply } from '#lib/utilities/add-builder-localizations';
import { SlashCommandSubcommandBuilder } from '@discordjs/builders';

export function buildMangaSubcommand(name: 'kitsu' | 'anilist') {
	return buildSubcommand(name, 'manga');
}

export function buildAnimeSubcommand(name: 'kitsu' | 'anilist') {
	return buildSubcommand(name, 'anime');
}

export function checkIsKitsuSubcommand(subCommand: string | null, _value?: Kitsu.KitsuResult | AniListResponse): _value is Kitsu.KitsuResult {
	return subCommand === 'kitsu';
}

function buildSubcommand(name: 'kitsu' | 'anilist', animeOrManga: 'anime' | 'manga') {
	const resolvedName = name === 'kitsu' ? LanguageKeys.Commands.Kitsu.SubcommandName : LanguageKeys.Commands.AniList.SubcommandName;
	const resolvedDescription =
		name === 'kitsu'
			? animeOrManga === 'anime'
				? LanguageKeys.Commands.Kitsu.Anime.RootDescription
				: LanguageKeys.Commands.Kitsu.Manga.RootDescription
			: animeOrManga === 'anime'
			? LanguageKeys.Commands.AniList.Anime.RootDescription
			: LanguageKeys.Commands.AniList.Manga.RootDescription;

	return apply(new SlashCommandSubcommandBuilder(), resolvedName, resolvedDescription) //
		.addStringOption((option) =>
			apply(option, animeOrManga === 'anime' ? LanguageKeys.Common.OptionsAnime : LanguageKeys.Common.OptionsManga) //
				.setRequired(true)
				.setAutocomplete(true)
		);
}
