

import { RequestHandler, Request, Response, NextFunction } from 'express';

export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  // runtime guard: passport may not have been initialized in some contexts
  console.log('DEBUG: requireAuth - isAuthenticated:', (req as any).isAuthenticated());

  console.log('DEBUG: requireAuth - req.user:', (req as any).user);

  console.log('DEBUG: requireAuth - req.sessionID:', req.sessionID);

  console.log('DEBUG: requireAuth - req.headers.cookie:', req.headers.cookie);
  if (typeof (req as any).isAuthenticated !== 'function' || !(req as any).isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

export const requireRole = (role: string): RequestHandler => {
  return (req, res, next) => {
    if (typeof (req as any).isAuthenticated !== 'function' || !(req as any).isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = (req as any).user;
    if (!user || user.role?.title !== role) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');