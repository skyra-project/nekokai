import { getAniListTitle, MediaFormat, type AnilistEntryTypeByKind } from '#lib/anilist';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { AniListSearchTitleLanguage } from '@prisma/client';
import type { Result } from '@sapphire/result';
import { cutText, isNullishOrEmpty, isNullishOrZero } from '@sapphire/utilities';
import { Command, type AutocompleteInteractionArguments } from '@skyra/http-framework';
import { getSupportedUserLanguageT, type TFunction, type TypedT } from '@skyra/http-framework-i18n';
import type { FetchError } from '@skyra/safe-fetch';
import type { LocaleString } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.AniList;

const FormatKeys = {
	[MediaFormat.Manga]: Root.MediaFormatManga,
	[MediaFormat.Movie]: Root.MediaFormatMovie,
	[MediaFormat.Music]: Root.MediaFormatMusic,
	[MediaFormat.Novel]: Root.MediaFormatNovel,
	[MediaFormat.OriginalNetAnimation]: Root.MediaFormatOriginalNetAnimation,
	[MediaFormat.OneShot]: Root.MediaFormatOneShot,
	[MediaFormat.OriginalVideoAnimation]: Root.MediaFormatOriginalVideoAnimation,
	[MediaFormat.Special]: Root.MediaFormatSpecial,
	[MediaFormat.TV]: Root.MediaFormatTV,
	[MediaFormat.TVShort]: Root.MediaFormatTVShort
} satisfies Record<MediaFormat, TypedT>;

export abstract class AnimeCommand<Kind extends 'anime' | 'manga'> extends Command {
	public override async autocompleteRun(interaction: Command.AutocompleteInteraction, options: AnimeCommand.AutocompleteArguments<Kind>) {
		const result = await this.autocompleteFetch(options);
		const t = getSupportedUserLanguageT(interaction);

		const preferences = await this.container.prisma.user.findUnique({ where: { id: BigInt(interaction.user.id) } });
		const titleLanguage = preferences?.preferredAniListSearchTitleLanguage ?? AniListSearchTitleLanguage.Unset;
		const entries = result.match({
			ok: (values) => values.map((value) => ({ name: this.renderAutocompleteOptionName(t, titleLanguage, value), value: value.id })),
			err: () => []
		});

		return interaction.reply({ choices: entries });
	}

	protected renderAutocompleteOptionName(t: TFunction, titleLanguage: AniListSearchTitleLanguage, value: AnilistEntryTypeByKind<Kind>) {
		const rawYear = value.seasonYear ?? value.startDate?.year ?? null;
		const year = isNullishOrZero(rawYear) ? t(Root.Unknown) : rawYear.toString();
		const kind = t(isNullishOrEmpty(value.format) ? Root.Unknown : FormatKeys[value.format]);
		const description = ` — ${year} ${kind}`;

		const title = getAniListTitle(value.title, t.lng as LocaleString, value.countryOfOrigin, titleLanguage);
		return `${cutText(title, 100 - description.length)}${description}`;
	}

	protected abstract autocompleteFetch(
		options: AnimeCommand.AutocompleteArguments<Kind>
	): Promise<Result<readonly AnilistEntryTypeByKind<Kind>[], FetchError>>;
}

export namespace AnimeCommand {
	export type LoaderContext = Command.LoaderContext;
	export type Options = Command.Options;
	export type Arguments<Kind extends 'anime' | 'manga'> = MakeArguments<Kind, number>;
	export type AutocompleteArguments<Kind extends 'anime' | 'manga'> = AutocompleteInteractionArguments<MakeArguments<Kind, string>>;
}

type Pretty<Type extends object> = { [K in keyof Type]: Type[K] };
type MakeArguments<Kind extends 'anime' | 'manga', Value extends string | number> = Pretty<
	{ [key in Kind]: Value } & { hide?: boolean; 'hide-description'?: boolean }
>;
