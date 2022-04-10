import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { UnsafeEmbedBuilder, userMention } from '@discordjs/builders';
import { err, ok } from '@sapphire/result';
import { envParseString } from '@skyra/env-wrapper';
import { Command, PieceContext, PieceOptions } from '@skyra/http-framework';
import { resolveUserKey } from '@skyra/http-framework-i18n';
import { APIApplicationCommandInteraction, APIUser, MessageFlags } from 'discord-api-types/v10';
import { platform, release } from 'node:os';

export abstract class AnimeCommand extends Command {
	private readonly type: string;

	// TODO: Command.Context
	public constructor(context: PieceContext, options: AnimeCommand.Options) {
		super(context, options);
		this.type = options.type;
	}

	protected override async chatInputRun(interaction: APIApplicationCommandInteraction, args: AnimeCommandArgs): Command.Response {
		const query = new URL('https://api.weeb.sh/images/random');
		query.searchParams.append('type', this.type);
		query.searchParams.append('nsfw', 'false');

		const result = await this.get(query);
		return result.success ? this.handleSuccess(result.value, args) : this.handleError(interaction, result.error);
	}

	private handleSuccess(result: AnimeCommandFetchResult, args: AnimeCommandArgs) {
		const content = args.user ? userMention(args.user.id) : undefined;
		const embed = new UnsafeEmbedBuilder()
			.setTitle('→')
			.setURL(result.url)
			.setColor(0x000000) // TODO: Add constant
			.setImage(result.url)
			.setFooter({ text: LanguageKeys.Commands.Anime.PoweredByWeebSh });
		return this.message({ content, embeds: [embed.toJSON()] });
	}

	private handleError(interaction: APIApplicationCommandInteraction, error: string) {
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
		'User-Agent': `Skyra/${envParseString('CLIENT_VERSION')} (undici) ${platform()}/${release()} (https://github.com/skyra-project/nekokai)`
	} as const;
}

export namespace AnimeCommand {
	// TODO: Command.Options
	export interface Options extends PieceOptions {
		type: string;
	}
}

interface AnimeCommandArgs {
	user?: APIUser;
}

interface AnimeCommandFetchResult {
	url: string;
}
