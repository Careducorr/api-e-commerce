import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.midleware';
import { somenteAdmin } from '../middlewares/admin.midleware';
import { CompraRepository } from '../modules/compra/repositories/CompraRepositorio';

const compraRepository = new CompraRepository();
const compraRoutes = Router();

compraRoutes.post(
    '/iniciada',
    authMiddleware,
    (request, response) => {
        return compraRepository.compraIniciada(request, response)
    }
);

compraRoutes.patch(
    '/alterar-endereco/:id_compra',
    authMiddleware,
    (request, response) => {
        return compraRepository.alterarEnderecoCompra(request, response)
    }
);

compraRoutes.patch(
    '/cancelar/:id_compra',
    authMiddleware,
    (request, response) => {
        return compraRepository.cancelarCompra(request, response)
    }
);

export { compraRoutes };