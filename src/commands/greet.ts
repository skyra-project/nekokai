import { createCommand } from '#lib/utilities/create-command';

export default createCommand({ type: 'greet', user: true, userRequired: true });
