import { createCommand } from '#lib/utilities/create-command';

export default createCommand({ path: import.meta.url, type: 'handholding', user: true, userRequired: true });
