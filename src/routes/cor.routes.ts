import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.midleware';
import { somenteAdmin } from '../middlewares/admin.midleware';
import { CorRepository } from '../modules/cor/repositories/CorRepositorio';

const corRoutes = Router();
const corRepository = new CorRepository();

corRoutes.post(
    '/cadastro-cor',
    authMiddleware,
    somenteAdmin,
    (request, response) => {
        return corRepository.cadastroCor(request, response)
    }
);

corRoutes.patch(
    '/editar-cor/:id_cor',
    authMiddleware,
    somenteAdmin,
    (request, response) => {
        return corRepository.editarCor(request, response)
    }
);

corRoutes.get(
    '/cores-produto/:id_produto',
    (request, response) => {
        return corRepository.buscarCoresPorProduto(request, response)
    }
);

corRoutes.delete(
    '/deletar-cor/:id_cor',
    authMiddleware,
    somenteAdmin,
    (request, response) => {
        return corRepository.deletarCor(request, response)
    }
);

corRoutes.get(
    '/produtos-sem-cor',
    authMiddleware,
    somenteAdmin,
    (request, response) => {
        return corRepository.listarProdutosSemCor(request, response)
    }
);

export { corRoutes };