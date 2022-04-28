import { BrandingColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { UnsafeEmbedBuilder, userMention } from '@discordjs/builders';
import { err, ok } from '@sapphire/result';
import { envParseString } from '@skyra/env-utilities';
import { Command, TransformedArguments } from '@skyra/http-framework';
import { resolveKey, resolveUserKey, type TypedT } from '@skyra/http-framework-i18n';
import { APIApplicationCommandInteraction, MessageFlags } from 'discord-api-types/v10';
import { platform, release } from 'node:os';

export class AnimeCommand extends Command {
	private readonly type: string;

	public constructor(context: Command.Context, options: AnimeCommand.Options) {
		super(context, options);
		this.type = options.type;
	}

	protected override async chatInputRun(interaction: Command.Interaction, args: AnimeCommandArgs): Promise<Command.MessageResponseResult> {
		const query = new URL('https://api.weeb.sh/images/random');
		query.searchParams.append('type', this.type);
		query.searchParams.append('nsfw', 'false');

		const result = await this.get(query);
		return result.success ? this.handleSuccess(interaction, result.value, args) : this.handleError(interaction, result.error);
	}

	private handleSuccess(interaction: Command.Interaction, result: AnimeCommandFetchResult, args: AnimeCommandArgs) {
		const content = args.user ? userMention(args.user.user.id) : undefined;
		const embed = new UnsafeEmbedBuilder()
			.setTitle('→')
			.setURL(result.url)
			.setColor(BrandingColors.Primary)
			.setImage(result.url)
			.setFooter({ text: resolveKey(interaction, LanguageKeys.Commands.Anime.PoweredByWeebSh) });
		return this.message({ content, embeds: [embed.toJSON()] });
	}

	private handleError(interaction: APIApplicationCommandInteraction, error: TypedT) {
		const content = resolveUserKey(interaction, error);
		return this.message({ content, flags: MessageFlags.Ephemeral });
	}

	private async get(url: URL) {
		const result = await fetch(url.href, { headers: AnimeCommand.headers });
		if (result.ok) return ok((await result.json()) as AnimeCommandFetchResult);

		// If we received a 5XX code error, warn the user about the service's unavailability.
		if (result.status >= 500) return err(LanguageKeys.Commands.Anime.UnavailableError);

		// If otherwise we got an 4XX error code, warn the user about unexpected error.
		console.error(`Unexpected error in ${this.name}: [${result.status}] ${await result.text()}`);
		return err(LanguageKeys.Commands.Anime.UnexpectedError);
	}

	private static readonly headers = {
		Authorization: `Wolke ${envParseString('WEEB_SH_TOKEN')}`,
		'User-Agent': `Skyra/${envParseString('CLIENT_VERSION')} (fetch) ${platform()}/${release()} (https://github.com/skyra-project/nekokai)`
	} as const;
}

export namespace AnimeCommand {
	export type Context = Command.Context;
	export interface Options extends Command.Options {
		type: string;
	}
}

interface AnimeCommandArgs {
	user?: TransformedArguments.User;
}

interface AnimeCommandFetchResult {
	url: string;
}
