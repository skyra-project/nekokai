import { createCommand } from '#lib/utilities/create-command';

export default createCommand({ type: 'pat', user: true, userRequired: true });
