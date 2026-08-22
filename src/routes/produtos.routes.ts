import { Router } from 'express';
import { ProductRepository } from '../modules/produtos/repositories/ProductRepositorio';
import { authMiddleware } from '../middlewares/auth.midleware';
import { somenteAdmin } from '../middlewares/admin.midleware';
import { FotosProdutoRepository } from '../modules/fotos-produto/repositories/FotosProdutosRepositorio';

const productRoutes = Router();
const productRepository = new ProductRepository();
const fotosProdutoRepository = new FotosProdutoRepository();

productRoutes.post(
    '/cadastro',
    authMiddleware,
    somenteAdmin,
    (request, response) => {

        return productRepository.create(request, response)

    });

    productRoutes.patch(
    '/editar/:id_produto',
    authMiddleware,
    somenteAdmin,
    (request, response) => {
        productRepository.updateProduto(request, response);
    });


    productRoutes.get('/todos', (request, response) => {
        productRepository.getTodosProdutos(request, response);
    })

    productRoutes.get('/buscar-produto', (request, response) => {
        productRepository.getProdutos(request, response);
    })

    productRoutes.get('/buscar-cor', (request, response) => {
        productRepository.getCores(request, response);
    })

    productRoutes.get('/buscar-tamanho', (request, response) => {
        productRepository.getTamanho(request, response);
    })

    productRoutes.delete(
    '/delete/:id_produto',
    authMiddleware,
    somenteAdmin,
    (request, response) => {
        productRepository.deleteProduto(request, response);
    });

export { productRoutes };