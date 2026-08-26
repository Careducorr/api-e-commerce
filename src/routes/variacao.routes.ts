import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.midleware';
import { somenteAdmin } from '../middlewares/admin.midleware';
import { VariacaoRepository } from '../modules/variacao-produto/repositories/VariacaoRepositorio';
import { CorRepository } from '../modules/cor/repositories/CorRepositorio';

const variacaoRoutes = Router();
const variacaoRepository = new VariacaoRepository();

variacaoRoutes.post(
   '/cadastro-variacao',
   authMiddleware,
   somenteAdmin,
   (request, response) => {

      return variacaoRepository.cadastroVariacao(request, response)

   });

variacaoRoutes.patch(
   '/editar-variacao/:id_variacao_produto',
   authMiddleware,
   somenteAdmin,
   (request, response) => {

      return variacaoRepository.updateVariacao(request, response)

   });

variacaoRoutes.get(
   '/variacao-produto/:id_produto/:id_cor',
   (request, response) => {
      return variacaoRepository.getVariacoesPorProduto(request, response)
   }
)

variacaoRoutes.delete(
   '/delete-variacao/:id_variacao_produto',
   authMiddleware,
   somenteAdmin,
   (request, response) => {
      variacaoRepository.deleteVariacao(request, response);
   }
);

variacaoRoutes.get(
   '/sem-variacao',
   authMiddleware,
   somenteAdmin,
   (request, response) => {
      variacaoRepository.getProdutosSemVariacao(request, response);
   }
);

export { variacaoRoutes };