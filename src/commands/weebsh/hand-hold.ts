import { createCommand } from '#lib/utilities/create-command';

export default createCommand({ type: 'handholding', name: 'hand-hold', user: true, userRequired: true });
