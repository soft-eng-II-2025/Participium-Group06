

import { RequestHandler, Request, Response, NextFunction } from 'express';

export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  // runtime guard: passport may not have been initialized in some contexts
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