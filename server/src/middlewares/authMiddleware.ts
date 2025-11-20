

import { RequestHandler, Request, Response, NextFunction } from 'express';

enum RoleMatchMode {
  EXACT = 'exact',
  PREFIX = 'prefix',
}


export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {

  if (typeof (req as any).isAuthenticated !== 'function' || !(req as any).isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// this extracts the role title from the user object, handling undefined and null cases
// when field is missing, assume "USER"
// when field is null, return undefined and it means no role assigned
const extractRoleTitle = (user: any): string | undefined => {
  if (!user) return undefined;
  if (!("role" in user)) {
    return "USER";
  }
  if (user.role === null) {
    return undefined;
  }
  return user.role;
};




// requireRole supports optional matching modes.
// EXACT: role must match exactly
// PREFIX: role must match exactly or be a subrole (e.g. TECH_LEAD_GREEN_AREAS matches TECH_LEAD)
const requireRole = (
  role: string,
  match: RoleMatchMode
): RequestHandler => {

  return (req, res, next) => {
    if (typeof (req as any).isAuthenticated !== 'function' || !(req as any).isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = (req as any).user;
    const userRoleTitle: string | undefined = extractRoleTitle(user);

    let allowed = false;
    if (user && typeof userRoleTitle === 'string') {
      if (match === RoleMatchMode.EXACT) {
        allowed = userRoleTitle === role;
      } else if (match === RoleMatchMode.PREFIX) {
        allowed = userRoleTitle === role || userRoleTitle.startsWith(`${role}_`);
      }
    }
    if (!allowed) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};

export const requireAdmin = requireRole('ADMIN', RoleMatchMode.EXACT);
export const requireUser = requireRole('USER', RoleMatchMode.EXACT);
export const requireTechLead = requireRole('TECH_LEAD', RoleMatchMode.PREFIX);
export const requireTechAgent = requireRole('TECH_AGENT', RoleMatchMode.PREFIX);
export const requireOrganizationOfficer = requireRole('ORGANIZATION_OFFICER', RoleMatchMode.EXACT);