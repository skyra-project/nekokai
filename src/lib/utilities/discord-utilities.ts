import {
	ButtonStyle,
	ComponentType,
	type APIActionRowComponent,
	type APIButtonComponentWithCustomId,
	type APIButtonComponentWithURL,
	type APIChannel,
	type APIMessageActionRowComponent
} from 'discord-api-types/v10';

export function isNsfwChannel(channel: Partial<APIChannel>): boolean {
	return 'nsfw' in channel ? (channel.nsfw ?? false) : false;
}

export function makeActionRow<Component extends APIMessageActionRowComponent>(
	components: Component[]
): APIActionRowComponent<APIMessageActionRowComponent> {
	return { type: ComponentType.ActionRow, components };
}

export type LinkButtonOptions = Omit<APIButtonComponentWithURL, 'type' | 'style'>;
export function makeLinkButton(options: LinkButtonOptions): APIButtonComponentWithURL {
	return { type: ComponentType.Button, style: ButtonStyle.Link, ...options };
}

export type ActionButtonOptions = Omit<APIButtonComponentWithCustomId, 'type'>;
export function makeActionButton(options: ActionButtonOptions): APIButtonComponentWithCustomId {
	return { type: ComponentType.Button, ...options };
}
