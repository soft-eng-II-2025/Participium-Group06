import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response, NextFunction } from "express";
import * as core from "express-serve-static-core";

// Generic middleware to validate body
export function validateDto<T extends object>(dtoClass: new () => T) {
    return async (req: Request<any, any, T>, res: Response, next: NextFunction) => {
        const dtoObject = plainToInstance(dtoClass, req.body);
        const errors = await validate(dtoObject);

        if (errors.length > 0) {
            const messages = errors
                .map(err => Object.values(err.constraints || {}))
                .flat();
            return res.status(400).json({ message: messages });
        }

        req.body = dtoObject;
        next();
    };
}
