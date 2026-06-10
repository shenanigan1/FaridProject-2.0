import { routes } from './app.routes';

describe('application routes', () => {
  it('does not allow managers to open the jobs workspace', () => {
    const jobsRoute = routes.find((route) => route.path === 'jobs');

    expect(jobsRoute?.data?.['roles']).toEqual(['hr', 'admin', 'director']);
  });

  it('allows all recruitment authority roles to open role management', () => {
    const rolesRoute = routes.find((route) => route.path === 'roles');

    expect(rolesRoute?.data?.['roles']).toEqual(['hr', 'admin', 'director']);
  });
});
