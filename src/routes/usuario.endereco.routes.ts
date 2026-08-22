import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.midleware';
import { EnderecoUsuarioRepository } from '../modules/endereco-usuario/repositories/EnderecoUsuarioRepositorio';

const enderecoRoutes = Router();
const enderecoUsuarioRepository = new EnderecoUsuarioRepository();

enderecoRoutes.post(
    '/cadastro-endereco',
    authMiddleware,
    (request, response) => {

       return enderecoUsuarioRepository.cadastrarEndereco(request, response)

    });

    enderecoRoutes.patch(
    '/alterar-endereco',
    authMiddleware,
    (request, response) => {

       return enderecoUsuarioRepository.alterarEndereco(request, response)

    });

export { enderecoRoutes };