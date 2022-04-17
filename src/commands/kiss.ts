import { AnimeCommand } from '#lib/structures';
import { RegisterCommand } from '@skyra/http-framework';

@RegisterCommand((builder) =>
	builder
		.setName('kiss')
		.setDescription('Kisses somebody')
		.addUserOption((option) => option.setName('user').setDescription('The user to kiss').setRequired(true))
)
export class UserAnimeCommand extends AnimeCommand {}
