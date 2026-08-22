import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

interface TokenPayload {
    id_usuario: string;
    email: string;
    acesso: string;
}

export function authMiddleware(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
        return response.status(401).json({
            sucesso: false,
            mensagem: 'Token não informado'
        });
    }

    const [, token] = authHeader.split(' ');

    try {
        const decoded = verify(token, process.env.SECRET as string) as TokenPayload;

        (request as any).usuario = decoded;

        next();

    } catch (error) {
        return response.status(401).json({
            sucesso: false,
            mensagem: 'Token inválido ou expirado'
        });
    }
}