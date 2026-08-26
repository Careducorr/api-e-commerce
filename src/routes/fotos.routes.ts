import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.midleware';
import { somenteAdmin } from '../middlewares/admin.midleware';
import { FotosProdutoRepository } from '../modules/fotos-produto/repositories/FotosProdutosRepositorio';
import { upload } from '../middlewares/upload.midleware';

const fotosProdutoRepository = new FotosProdutoRepository();
const fotosRoutes = Router();


fotosRoutes.post(
    '/cadastro-fotos',
    authMiddleware,
    somenteAdmin,
    upload.single('foto'),
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
    upload.single('foto'),
    (request, response) => {
        fotosProdutoRepository.editarFoto(request, response);
    }
);

fotosRoutes.get(
    '/listar-sem-foto',
    authMiddleware,
    somenteAdmin,
    (request, response) => {
        fotosProdutoRepository.listarProdutosSemFoto(request, response);
    }
);

export { fotosRoutes };