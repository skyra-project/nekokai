import { createCommand } from '#lib/utilities/create-command';

export default createCommand({ type: 'punch', user: true, userRequired: true });
