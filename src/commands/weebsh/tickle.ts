import { createCommand } from '#lib/utilities/create-command';

export default createCommand({ type: 'tickle', user: true, userRequired: true });
