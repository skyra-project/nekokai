import { MediaFormat, type MediaTitle } from '#lib/apis/anilist/anilist-types';
import { parseAniListDescription, type AnilistEntryTypeByKind } from '#lib/apis/anilist/anilist-utilities';
import { BrandingColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { durationFormatter } from '#lib/utilities/duration-formatter';
import { minutes } from '#lib/utilities/time-utilities';
import { EmbedBuilder, bold, hideLinkEmbed, hyperlink } from '@discordjs/builders';
import type { Result } from '@sapphire/result';
import { cutText, filterNullish, isNullishOrEmpty, isNullishOrZero } from '@sapphire/utilities';
import { Command, type AutocompleteInteractionArguments, type MessageResponseOptions } from '@skyra/http-framework';
import { getSupportedLanguageT, getSupportedUserLanguageT, resolveUserKey, type TFunction, type TypedT } from '@skyra/http-framework-i18n';
import type { FetchError } from '@skyra/safe-fetch';
import { MessageFlags, type LocaleString } from 'discord-api-types/v10';

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
		const entries = result.match({
			ok: (values) => values.map((value) => ({ name: this.renderAutocompleteOptionName(t, value), value: value.id })),
			err: () => []
		});

		return interaction.reply({ choices: entries });
	}

	protected renderAutocompleteOptionName(t: TFunction, value: AnilistEntryTypeByKind<Kind>) {
		const rawYear = value.seasonYear ?? value.startDate?.year ?? null;
		const year = isNullishOrZero(rawYear) ? t(Root.Unknown) : rawYear.toString();
		const kind = t(isNullishOrEmpty(value.format) ? Root.Unknown : FormatKeys[value.format]);
		const description = ` — ${year} ${kind}`;

		const title = this.getTitle(value.title, t.lng as LocaleString, value.countryOfOrigin);
		return `${cutText(title, 100 - description.length)}${description}`;
	}

	protected handleResult(
		interaction: Command.ChatInputInteraction,
		result: Result<AnilistEntryTypeByKind<Kind> | null, FetchError>,
		kind: Kind,
		hide: boolean | null | undefined
	) {
		hide ??= false;

		const t = hide ? getSupportedUserLanguageT(interaction) : getSupportedLanguageT(interaction);
		const response = result.match({
			ok: (value) => (isNullishOrEmpty(value) ? this.createErrorResponse(interaction, kind) : this.createResponse(value, t, hide)),
			err: () => this.createErrorResponse(interaction, kind)
		});
		return interaction.reply(response);
	}

	protected createResponse(value: AnilistEntryTypeByKind<Kind>, t: TFunction, hide: boolean): MessageResponseOptions {
		return { embeds: [this.createEmbed(value, t).toJSON()], flags: hide ? MessageFlags.Ephemeral : undefined };
	}

	protected createErrorResponse(interaction: Command.ChatInputInteraction, kind: Kind) {
		return {
			content: resolveUserKey(interaction, kind === 'anime' ? Root.Anime.SearchError : Root.Manga.SearchError),
			flags: MessageFlags.Ephemeral
		};
	}

	protected abstract autocompleteFetch(
		options: AnimeCommand.AutocompleteArguments<Kind>
	): Promise<Result<readonly AnilistEntryTypeByKind<Kind>[], FetchError>>;

	private createEmbed(value: AnilistEntryTypeByKind<Kind>, t: TFunction) {
		const anilistTitles = t(Root.EmbedTitles);
		const description = [
			`**${anilistTitles.romajiName}**: ${value.title.romaji || t(LanguageKeys.Common.None)}`,
			`**${anilistTitles.englishName}**: ${value.title.english || t(LanguageKeys.Common.None)}`,
			`**${anilistTitles.nativeName}**: ${value.title.native || t(LanguageKeys.Common.None)}`
		];

		if (value.countryOfOrigin) {
			description.push(`${bold(anilistTitles.countryOfOrigin)}: ${this.getCountry(t, value.countryOfOrigin)}`);
		}

		if ('episodes' in value && value.episodes) {
			description.push(`${bold(anilistTitles.episodes)}: ${t(LanguageKeys.Common.FormatNumber, { value: value.episodes })}`);
		}

		if ('chapters' in value && value.chapters) {
			description.push(`${bold(anilistTitles.chapters)}: ${t(LanguageKeys.Common.FormatNumber, { value: value.chapters })}`);
		}

		if ('volumes' in value && value.volumes) {
			description.push(`${bold(anilistTitles.volumes)}: ${t(LanguageKeys.Common.FormatNumber, { value: value.volumes })}`);
		}

		if ('duration' in value && value.duration) {
			description.push(`${bold(anilistTitles.episodeLength)}: ${durationFormatter.format(minutes(value.duration), 1)}`);
		}

		if (value.externalLinks?.length) {
			const externalLinks = value.externalLinks
				.map((link) => (link?.url && link.site ? hyperlink(link.site, hideLinkEmbed(link.url)) : undefined))
				.filter(filterNullish);

			if (externalLinks.length) {
				description.push(`${bold(anilistTitles.externalLinks)}: ${t(LanguageKeys.Common.FormatList, { value: externalLinks })}`);
			}
		}

		if (value.description) {
			description.push('', parseAniListDescription(value.description));
		}

		const locale = t.lng as LocaleString;
		return new EmbedBuilder()
			.setColor(BrandingColors.Primary)
			.setTitle(this.getTitle(value.title, locale, value.countryOfOrigin))
			.setURL(value.siteUrl ?? null)
			.setDescription(description.join('\n'))
			.setImage(`https://img.anili.st/media/${value.id}`)
			.setFooter({ text: '© anilist.co' });
	}

	private getCountry(t: TFunction, origin: NonNullable<AnilistEntryTypeByKind<Kind>['countryOfOrigin']>) {
		switch (origin) {
			case 'CN':
				return `${t(Root.CountryChina)} 🇨🇳`;
			case 'JP':
				return `${t(Root.CountryJapan)} 🇯🇵`;
			case 'KR':
				return `${t(Root.CountryKorea)} 🇰🇷`;
			case 'TW':
				return `${t(Root.CountryTaiwan)} 🇹🇼`;
			default:
				this.container.logger.warn(`[ANILIST] Received unknown origin: ${origin}`);
				return origin;
		}
	}

	private getTitle(title: MediaTitle, locale: LocaleString, origin: string | null | undefined) {
		return this.shouldUseNative(locale, origin ?? 'JP')
			? (title.native ?? title.english ?? title.romaji!)
			: (title.english ?? title.romaji ?? title.native!);
	}

	private shouldUseNative(locale: LocaleString, origin: string) {
		if (locale === 'ja') return origin === 'JP';
		if (locale === 'zh-CN') return origin === 'CN';
		if (locale === 'ko') return origin === 'KR';
		return false;
	}
}

export namespace AnimeCommand {
	export type LoaderContext = Command.LoaderContext;
	export type Options = Command.Options;
	export type Arguments<Kind extends 'anime' | 'manga'> = MakeArguments<Kind, number>;
	export type AutocompleteArguments<Kind extends 'anime' | 'manga'> = AutocompleteInteractionArguments<MakeArguments<Kind, string>>;
}

type Pretty<Type extends object> = { [K in keyof Type]: Type[K] };
type MakeArguments<Kind extends 'anime' | 'manga', Value extends string | number> = Pretty<{ [key in Kind]: Value } & { hide?: boolean }>;
