import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.midleware';
import { somenteAdmin } from '../middlewares/admin.midleware';
import { MarcasRepository } from '../modules/marcas/repositories/MarcasRepositorio';

const marcasRoutes = Router();
const marcasRepository = new MarcasRepository()

marcasRoutes.post(
    '/cadastro',
    authMiddleware,
    somenteAdmin,
    (request, response) => {

       return marcasRepository.create(request, response)

    });

    marcasRoutes.delete(
    '/delete/:id_marca',
    authMiddleware,
    somenteAdmin,
    (request, response) => {
        marcasRepository.deleteMarca(request, response);
    }
);

marcasRoutes.patch(
    '/editar/:id_marca',
    authMiddleware,
    somenteAdmin,
    (request, response) => {
        marcasRepository.updateMarca(request, response);
    }
);

marcasRoutes.get('/buscar-marca', (request, response) => {
    marcasRepository.getProdutosPorMarca(request, response);
})

marcasRoutes.get('/listar-marcas', (request, response) => {
    marcasRepository.getMarcas(request, response);
})

export { marcasRoutes };