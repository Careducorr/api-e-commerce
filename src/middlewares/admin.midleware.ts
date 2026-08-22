import { Request, Response, NextFunction } from 'express';

export function somenteAdmin(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const usuario = (request as any).usuario;

    if (usuario.acesso !== 'admin') {
        return response.status(403).json({
            sucesso: false,
            mensagem: 'Acesso permitido somente para administradores'
        });
    }

    next();
}