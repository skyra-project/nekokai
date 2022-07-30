import { fetchAniListApi, getAnime, parseAniListDescription } from '#lib/apis/anilist/anilist-constants';
import type { Media } from '#lib/apis/anilist/anilist-types';
import { fetchKitsuApi } from '#lib/apis/kitsu/kitsu-constants';
import type { KitsuHit } from '#lib/apis/kitsu/kitsu-types';
import { BrandingColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { RedisKeys } from '#lib/redis-cache/RedisCacheClient';
import { durationFormatter } from '#lib/utilities/duration-formatter';
import { buildAnimeSubcommand, checkIsKitsuSubcommand } from '#lib/utilities/search-command-helpers';
import { minutes } from '#lib/utilities/time-utilities';
import { bold, EmbedBuilder, hideLinkEmbed, hyperlink, time, TimestampStyles } from '@discordjs/builders';
import { cutText, filterNullish, isNullish, isNullishOrEmpty } from '@sapphire/utilities';
import { AutocompleteInteractionArguments, Command, InteractionArguments, RegisterCommand, RegisterSubCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedLanguageT, resolveKey } from '@skyra/http-framework-i18n';
import type { APIApplicationCommandOptionChoice } from 'discord-api-types/v10';

@RegisterCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Common.AnimeName, LanguageKeys.Common.AnimeDescription))
export class UserCommand extends Command {
	public override async autocompleteRun(
		autocompleteInteraction: Command.AutocompleteInteraction,
		options: AutocompleteInteractionArguments<Options>
	) {
		if (!options.subCommand || options.focused !== 'anime' || isNullishOrEmpty(options.anime)) {
			return this.autocompleteNoResults();
		}

		switch (options.subCommand as 'kitsu' | 'anilist') {
			case 'kitsu':
				return this.kitsuAutocompleteRun(autocompleteInteraction, options);
			case 'anilist':
				return this.aniListAutocompleteRun(autocompleteInteraction, options);
		}
	}

	@RegisterSubCommand(buildAnimeSubcommand('kitsu'))
	@RegisterSubCommand(buildAnimeSubcommand('anilist'))
	public async *sharedRun(interaction: Command.Interaction, { subCommand, anime }: InteractionArguments<Options>): Command.AsyncGeneratorResponse {
		const isKitsuSubcommand = checkIsKitsuSubcommand(subCommand);

		const [, packageFromAutocomplete, nthResult] = anime.split(':');
		const hitFromRedisCache = await this.container.redisCache.fetch<KitsuHit | Media>(
			isKitsuSubcommand ? RedisKeys.KitsuAnime : RedisKeys.AnilistAnime,
			interaction.user?.id,
			packageFromAutocomplete,
			nthResult
		);

		if (hitFromRedisCache) {
			return this.message(
				isKitsuSubcommand
					? this.buildKitsuResponse(hitFromRedisCache as KitsuHit, interaction)
					: this.buildAnilistResponse(hitFromRedisCache as Media, interaction)
			);
		}

		yield this.defer();
		const result = isKitsuSubcommand
			? await fetchKitsuApi('anime', packageFromAutocomplete ?? anime, 1)
			: await fetchAniListApi(getAnime, { search: anime });

		const response = result.match({
			ok: (value) => {
				if (checkIsKitsuSubcommand(subCommand, value)) {
					return isNullishOrEmpty(value.hits) //
						? this.handleError(interaction)
						: this.buildKitsuResponse(value.hits[0], interaction);
				}

				return isNullishOrEmpty(value.data.Page.media) //
					? this.handleError(interaction)
					: this.buildAnilistResponse(value.data.Page.media[0]!, interaction);
			},
			err: () => this.handleError(interaction)
		});

		return this.updateResponse(response);
	}

	private buildKitsuResponse(kitsuAnime: KitsuHit, interaction: Command.Interaction): Command.MessageResponseOptions {
		const t = getSupportedLanguageT(interaction);

		const description =
			// Prefer the synopsis
			kitsuAnime.synopsis ||
			// Then prefer the English description
			kitsuAnime.description?.en ||
			// Then prefer the English-us description
			kitsuAnime.description?.en_us ||
			// Then prefer the latinized Japanese description
			kitsuAnime.description?.en_jp ||
			// Then the description in kanji / hiragana / katakana
			kitsuAnime.description?.ja_jp ||
			// If all fails just get the first key of the description
			kitsuAnime.description?.[Object.keys(kitsuAnime.description!)[0]];
		const synopsis = description ? cutText(description.replace(/(.+)[\r\n\t](.+)/gim, '$1 $2').split('\r\n')[0], 750) : null;
		const score = `${kitsuAnime.averageRating}%`;
		const animeURL = `https://kitsu.io/anime/${kitsuAnime.id}`;
		const type = kitsuAnime.subtype;
		const title = kitsuAnime.titles.en || kitsuAnime.titles.en_jp || kitsuAnime.canonicalTitle || '--';

		const englishTitle = kitsuAnime.titles.en || kitsuAnime.titles.en_us || t(LanguageKeys.Common.None);
		const japaneseTitle = kitsuAnime.titles.ja_jp || t(LanguageKeys.Common.None);
		const canonicalTitle = kitsuAnime.canonicalTitle || t(LanguageKeys.Common.None);

		const embedData = t(LanguageKeys.Commands.Kitsu.Anime.EmbedData);

		const embed = new EmbedBuilder()
			.setColor(BrandingColors.Primary)
			.setTitle(title)
			.setURL(animeURL)
			.setDescription(
				t(LanguageKeys.Commands.Kitsu.Anime.OutputDescription, {
					englishTitle,
					japaneseTitle,
					canonicalTitle,
					synopsis: synopsis ?? t(LanguageKeys.Common.NoSynopsis)
				})
			)
			.setThumbnail(kitsuAnime.posterImage?.original || '')
			.addFields(
				{
					name: embedData.type,
					value: t(LanguageKeys.Commands.Kitsu.Anime.Types)[type.toLowerCase()] || type,
					inline: true
				},
				{
					name: embedData.score,
					value: score,
					inline: true
				},
				{
					name: embedData.episodes,
					value: kitsuAnime.episodeCount ? t(LanguageKeys.Common.FormatNumber, { value: kitsuAnime.episodeCount }) : embedData.stillAiring,
					inline: true
				},
				{
					name: embedData.episodeLength,
					value: durationFormatter.format(kitsuAnime.episodeLength * 60 * 1000),
					inline: true
				},
				{
					name: embedData.ageRating,
					value: kitsuAnime.ageRating ? kitsuAnime.ageRating : t(LanguageKeys.Common.None),
					inline: true
				},
				{
					name: embedData.firstAirDate,
					value: time(kitsuAnime.startDate, TimestampStyles.ShortDate),
					inline: true
				},
				{
					name: embedData.watchIt,
					value: bold(hyperlink(title, hideLinkEmbed(animeURL))),
					inline: true
				}
			)
			.setFooter({ text: '© kitsu.io' })
			.toJSON();

		return { embeds: [embed] };
	}

	private buildAnilistResponse(anilistAnime: Media, interaction: Command.Interaction): Command.MessageResponseOptions {
		const embed = new EmbedBuilder();

		const t = getSupportedLanguageT(interaction);

		const anilistTitles = t(LanguageKeys.Commands.AniList.EmbedTitles);

		const englishTitle = anilistAnime.title?.english || t(LanguageKeys.Common.None);
		const nativeTitle = anilistAnime.title?.native || t(LanguageKeys.Common.None);
		const romajiTitle = anilistAnime.title?.romaji || t(LanguageKeys.Common.None);

		const description = [
			`**${anilistTitles.romajiName}**: ${romajiTitle}`,
			`**${anilistTitles.englishName}**: ${englishTitle}`,
			`**${anilistTitles.nativeName}**: ${nativeTitle}`
		];

		if (anilistAnime.countryOfOrigin) {
			description.push(`${bold(anilistTitles.countryOfOrigin)}: ${anilistAnime.countryOfOrigin}`);
		}

		if (anilistAnime.episodes) {
			description.push(`${bold(anilistTitles.episodes)}: ${t(LanguageKeys.Common.FormatNumber, { value: anilistAnime.episodes })}`);
		}

		if (anilistAnime.duration) {
			description.push(`${bold(anilistTitles.episodeLength)}: ${durationFormatter.format(minutes(anilistAnime.duration), 1)}`);
		}

		if (anilistAnime.externalLinks?.length) {
			const externalLinks = anilistAnime.externalLinks
				.map((link) => {
					if (link?.url && link.site) {
						return hyperlink(link.site, hideLinkEmbed(link.url));
					}

					return undefined;
				})
				.filter(filterNullish);

			description.push(`${bold(anilistTitles.externalLinks)}: ${t(LanguageKeys.Common.FormatList, { value: externalLinks })}`);
		}

		if (anilistAnime.description) {
			description.push('', parseAniListDescription(anilistAnime.description));
		}

		if (anilistAnime.siteUrl) {
			embed.setURL(anilistAnime.siteUrl);
		}

		return {
			embeds: [
				embed
					.setColor(BrandingColors.Primary)
					.setTitle(anilistAnime.title?.english ?? anilistAnime.title?.romaji ?? anilistAnime.title?.native ?? '') //
					.setDescription(description.join('\n'))
					.setImage(`https://img.anili.st/media/${anilistAnime.id}`)
					.toJSON()
			]
		};
	}

	private async kitsuAutocompleteRun(
		autocompleteInteraction: Command.AutocompleteInteraction,
		options: AutocompleteInteractionArguments<Options>
	): Command.AsyncAutocompleteResponse {
		const result = await fetchKitsuApi('anime', options.anime);
		return result.match({
			ok: async (value) => {
				const redisInsertPromises: Promise<'OK'>[] = [];
				const results: APIApplicationCommandOptionChoice[] = [];

				for (const [index, hit] of value.hits?.entries() ?? []) {
					redisInsertPromises.push(
						this.container.redisCache.insertFor60Seconds<KitsuHit>(
							RedisKeys.KitsuAnime,
							autocompleteInteraction.user?.id,
							options.anime,
							index.toString(),
							hit
						)
					);

					results.push({
						name: cutText(hit.titles.en || hit.titles.en_jp || hit.canonicalTitle || hit.slug, 100),
						value: `${RedisKeys.KitsuAnime}:${options.anime}:${index}`
					});
				}

				if (redisInsertPromises.length) {
					await Promise.all(redisInsertPromises);
				}

				return this.autocomplete({
					choices: results.slice(0, 24)
				});
			},
			err: () => this.autocompleteNoResults()
		});
	}

	private async aniListAutocompleteRun(
		autocompleteInteraction: Command.AutocompleteInteraction,
		options: AutocompleteInteractionArguments<Options>
	): Command.AsyncAutocompleteResponse {
		const result = await fetchAniListApi(getAnime, { search: options.anime });

		return result.match({
			ok: async (value) => {
				const redisInsertPromises: Promise<'OK'>[] = [];
				const results: APIApplicationCommandOptionChoice[] = [];

				for (const [index, hit] of value.data.Page.media?.entries() ?? []) {
					if (isNullish(hit)) continue;

					redisInsertPromises.push(
						this.container.redisCache.insertFor60Seconds<Media>(
							RedisKeys.AnilistAnime,
							autocompleteInteraction.user?.id,
							options.anime,
							index.toString(),
							hit
						)
					);

					results.push({
						name: cutText(hit.title?.english || hit.title?.romaji || hit.title?.native || hit.id.toString(), 100),
						value: `${RedisKeys.AnilistAnime}:${options.anime}:${index}`
					});
				}

				if (redisInsertPromises.length) {
					await Promise.all(redisInsertPromises);
				}

				return this.autocomplete({
					choices: results.slice(0, 24)
				});
			},
			err: () => this.autocompleteNoResults()
		});
	}

	private handleError(interaction: Command.Interaction): Command.MessageResponseOptions {
		return { content: resolveKey(interaction, LanguageKeys.Common.AnimeError) };
	}
}

interface Options {
	anime: string;
}
