import type { AnilistEntry, MediaTitle } from '#lib/apis/anilist/anilist-types';
import { parseAniListDescription } from '#lib/apis/anilist/anilist-utilities';
import { BrandingColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { durationFormatter } from '#lib/utilities/duration-formatter';
import { minutes } from '#lib/utilities/time-utilities';
import { EmbedBuilder, bold, hideLinkEmbed, hyperlink } from '@discordjs/builders';
import type { Result } from '@sapphire/result';
import { cutText, filterNullish, isNullishOrEmpty } from '@sapphire/utilities';
import { Command, type AutocompleteInteractionArguments, type InteractionArguments } from '@skyra/http-framework';
import { getSupportedLanguageT, getSupportedUserLanguageName, resolveUserKey, type TFunction } from '@skyra/http-framework-i18n';
import type { FetchError } from '@skyra/safe-fetch';
import { MessageFlags, type APIEmbed, type LocaleString } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.AniList;

export abstract class AnimeCommand<Kind extends 'anime' | 'manga'> extends Command {
	public override async autocompleteRun(interaction: Command.AutocompleteInteraction, options: AnimeCommand.AutocompleteArguments<Kind>) {
		const result = await this.autocompleteFetch(options);
		const locale = getSupportedUserLanguageName(interaction);
		const entries = result.match({
			ok: (values) => {
				return values.map((value) => ({
					name: cutText(this.getTitle(value.title, locale, value.countryOfOrigin), 100),
					value: cutText(value.title.english || value.title.romaji || value.title.native!, 100)
				}));
			},
			err: () => []
		});

		return interaction.reply({ choices: entries });
	}

	protected handleResult(interaction: Command.ChatInputInteraction, result: Result<AnilistEntry | null, FetchError>, kind: Kind) {
		const response = result.match({
			ok: (value) =>
				isNullishOrEmpty(value)
					? this.createErrorResponse(interaction, kind)
					: this.createResponse(value, getSupportedLanguageT(interaction)),
			err: () => this.createErrorResponse(interaction, kind)
		});
		return interaction.reply(response);
	}

	protected createResponse(value: AnilistEntry, t: TFunction): { embeds: APIEmbed[] } {
		return { embeds: [this.createEmbed(value, t).toJSON()] };
	}

	protected createErrorResponse(interaction: Command.ChatInputInteraction, kind: Kind) {
		return {
			content: resolveUserKey(interaction, kind === 'anime' ? Root.Anime.SearchError : Root.Manga.SearchError),
			flags: MessageFlags.Ephemeral
		};
	}

	protected abstract autocompleteFetch(options: AnimeCommand.AutocompleteArguments<Kind>): Promise<Result<readonly AnilistEntry[], FetchError>>;

	private createEmbed(value: AnilistEntry, t: TFunction) {
		const anilistTitles = t(Root.EmbedTitles);
		const description = [
			`**${anilistTitles.romajiName}**: ${value.title.romaji || t(LanguageKeys.Common.None)}`,
			`**${anilistTitles.englishName}**: ${value.title.english || t(LanguageKeys.Common.None)}`,
			`**${anilistTitles.nativeName}**: ${value.title.native || t(LanguageKeys.Common.None)}`
		];

		if (value.countryOfOrigin) {
			description.push(`${bold(anilistTitles.countryOfOrigin)}: ${this.getCountry(t, value.countryOfOrigin)}`);
		}

		if (value.episodes) {
			description.push(`${bold(anilistTitles.episodes)}: ${t(LanguageKeys.Common.FormatNumber, { value: value.episodes })}`);
		}

		if (value.chapters) {
			description.push(`${bold(anilistTitles.chapters)}: ${t(LanguageKeys.Common.FormatNumber, { value: value.chapters })}`);
		}

		if (value.volumes) {
			description.push(`${bold(anilistTitles.volumes)}: ${t(LanguageKeys.Common.FormatNumber, { value: value.volumes })}`);
		}

		if (value.duration) {
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

	private getCountry(t: TFunction, origin: NonNullable<AnilistEntry['countryOfOrigin']>) {
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
			? title.native ?? title.english ?? title.romaji!
			: title.english ?? title.romaji ?? title.native!;
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
	export type Arguments<Kind extends 'anime' | 'manga'> = InteractionArguments<Kind extends 'anime' ? { anime: string } : { manga: string }>;
	export type AutocompleteArguments<Kind extends 'anime' | 'manga'> = AutocompleteInteractionArguments<Arguments<Kind>>;
}
