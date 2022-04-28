import { createCommand } from '#lib/utilities/create-command';

export default createCommand({ type: 'poke', user: true, userRequired: true });
