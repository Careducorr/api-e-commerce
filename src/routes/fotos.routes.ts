import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.midleware';
import { somenteAdmin } from '../middlewares/admin.midleware';
import { FotosProdutoRepository } from '../modules/fotos-produto/repositories/FotosProdutosRepositorio';

const fotosProdutoRepository = new FotosProdutoRepository();
const fotosRoutes = Router();


fotosRoutes.post(
    '/cadastro-fotos',
    authMiddleware,
    somenteAdmin,
    (request, response) => {

        return fotosProdutoRepository.cadastroFoto(request, response)

    });

fotosRoutes.get('/fotos', (request, response) => {
    fotosProdutoRepository.getFotos(request, response);
})

fotosRoutes.delete(
    '/delete-foto/:id_foto',
    authMiddleware,
    somenteAdmin,
    (request, response) => {
        fotosProdutoRepository.deletarFoto(request, response);
    }
);

fotosRoutes.patch(
    '/editar-foto/:id_foto',
    authMiddleware,
    somenteAdmin,
    (request, response) => {
        fotosProdutoRepository.editarFoto(request, response);
    }
);

export { fotosRoutes };