import type { Kitsu } from '#lib/apis/kitsu/Kitsu';
import { fetchKitsuApi } from '#lib/apis/kitsu/kitsu-constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { RedisKeys } from '#lib/redis-cache/RedisCacheClient';
import { apply } from '#lib/utilities/add-builder-localizations';
import { bold, EmbedBuilder, hideLinkEmbed, hyperlink, time, TimestampStyles } from '@discordjs/builders';
import { cutText, isNullishOrEmpty } from '@sapphire/utilities';
import { AutocompleteInteractionArguments, Command, RegisterCommand } from '@skyra/http-framework';
import { getSupportedUserLanguageT, resolveUserKey } from '@skyra/http-framework-i18n';
import { APIApplicationCommandOptionChoice, MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	apply(builder, LanguageKeys.Commands.Kitsu.Manga.RootName, LanguageKeys.Commands.Kitsu.Manga.RootDescription) //
		.addStringOption((option) =>
			apply(option, LanguageKeys.Common.OptionsManga) //
				.setRequired(true)
				.setAutocomplete(true)
		)
)
export class UserCommand extends Command {
	public override async autocompleteRun(_: Command.AutocompleteInteraction, options: AutocompleteInteractionArguments<Options>) {
		if (options.focused !== 'manga' || isNullishOrEmpty(options.manga)) {
			return this.autocompleteNoResults();
		}

		const result = await fetchKitsuApi('manga', options.manga);
		return result.match({
			ok: async (value) => {
				const redisInsertPromises: Promise<'OK'>[] = [];
				const results: APIApplicationCommandOptionChoice[] = [];

				for (const [index, hit] of value.hits?.entries() ?? []) {
					redisInsertPromises.push(
						this.container.redisCache.insertFor60Seconds<Kitsu.KitsuHit>(RedisKeys.KitsuManga, options.manga, index.toString(), hit)
					);

					results.push({
						name: cutText(hit.titles.en || hit.titles.en_jp || hit.canonicalTitle || hit.slug, 100),
						value: `${RedisKeys.KitsuManga}:${options.manga}:${index}`
					});
				}

				if (redisInsertPromises.length) {
					await Promise.all(redisInsertPromises);
				}

				return this.autocomplete({
					choices: results.slice(0, 19)
				});
			},
			err: () => this.autocompleteNoResults()
		});
	}

	public override async chatInputRun(interaction: Command.Interaction, { manga }: Options) {
		const [, packageFromAutocomplete, nthResult] = manga.split(':');
		const hitFromRedisCache = await this.container.redisCache.fetch<Kitsu.KitsuHit>(RedisKeys.KitsuManga, packageFromAutocomplete, nthResult);

		if (hitFromRedisCache) {
			return this.buildResponse(hitFromRedisCache, interaction);
		}

		const result = await fetchKitsuApi('manga', packageFromAutocomplete ?? manga, 1);

		return result.match({
			ok: (value) =>
				isNullishOrEmpty(value.hits) //
					? this.handleError(interaction)
					: this.buildResponse(value.hits[0], interaction),
			err: () => this.handleError(interaction)
		});
	}

	private buildResponse(entry: Kitsu.KitsuHit, interaction: Command.Interaction): Command.Response {
		const t = getSupportedUserLanguageT(interaction);

		const description =
			// Prefer the synopsis
			entry.synopsis ||
			// Then prefer the English description
			entry.description?.en ||
			// Then prefer the English-us description
			entry.description?.en_us ||
			// Then prefer the latinized Japanese description
			entry.description?.en_jp ||
			// Then the description in kanji / hiragana / katakana
			entry.description?.ja_jp ||
			// If all fails just get the first key of the description
			entry.description?.[Object.keys(entry.description!)[0]];
		const synopsis = description ? cutText(description.replace(/(.+)[\r\n\t](.+)/gim, '$1 $2').split('\r\n')[0], 750) : null;
		const score = `${entry.averageRating}%`;
		const mangaURL = `https://kitsu.io/manga/${entry.id}`;
		const type = entry.subtype;
		const title = entry.titles.en || entry.titles.en_jp || entry.canonicalTitle || '--';

		const englishTitle = entry.titles.en || entry.titles.en_us || t(LanguageKeys.Common.None);
		const japaneseTitle = entry.titles.ja_jp || t(LanguageKeys.Common.None);
		const canonicalTitle = entry.canonicalTitle || t(LanguageKeys.Common.None);

		const embedData = t(LanguageKeys.Commands.Kitsu.Manga.EmbedData);

		const embed = new EmbedBuilder()
			.setTitle(title)
			.setURL(mangaURL)
			.setDescription(
				t(LanguageKeys.Commands.Kitsu.Manga.OutputDescription, {
					englishTitle,
					japaneseTitle,
					canonicalTitle,
					synopsis: synopsis ?? t(LanguageKeys.Common.NoSynopsis)
				})
			)
			.setThumbnail(entry.posterImage?.original || '')
			.addFields(
				{
					name: embedData.type,
					value: t(LanguageKeys.Commands.Kitsu.Manga.Types)[type.toLowerCase()] || type,
					inline: true
				},
				{
					name: embedData.score,
					value: score,
					inline: true
				},
				{
					name: embedData.ageRating,
					value: entry.ageRating ? entry.ageRating : t(LanguageKeys.Common.None),
					inline: true
				},
				{
					name: embedData.firstPublishDate,
					value: time(entry.startDate, TimestampStyles.ShortDate),
					inline: true
				},
				{
					name: embedData.readIt,
					value: bold(hyperlink(title, hideLinkEmbed(mangaURL))),
					inline: true
				}
			)
			.setFooter({ text: '© kitsu.io' })
			.toJSON();

		return this.message({ embeds: [embed] });
	}

	private handleError(interaction: Command.Interaction): Command.Response {
		return this.message({
			content: resolveUserKey(interaction, LanguageKeys.Common.MangaError),
			flags: MessageFlags.Ephemeral
		});
	}
}

interface Options {
	manga: string;
}
