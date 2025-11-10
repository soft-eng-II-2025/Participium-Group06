import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response, NextFunction } from "express";

export function validateDto<T extends object>(dtoClass: new () => T) {
    return async (req: Request<any, any, any>, res: Response, next: NextFunction) => {
        const dtoObject = plainToInstance(dtoClass, req.body);

        const errors = await validate(dtoObject, {
            whitelist: true,               // rimuove i campi non dichiarati nel DTO
            forbidNonWhitelisted: true,    // ma li trasforma anche in errore 400
            forbidUnknownValues: true,     // rifiuta input “strani” (null, etc.)
        });

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
