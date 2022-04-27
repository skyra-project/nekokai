import { createCommand } from '#lib/utilities/create-command';

export default createCommand({ type: 'highfive', name: 'high-five', user: true, userRequired: true });
