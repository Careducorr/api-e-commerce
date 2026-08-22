import { Router } from 'express';
import { UserRepository } from '../modules/usuario/repositories/UsuarioRepositorio';
import { authMiddleware } from '../middlewares/auth.midleware';
import { somenteAdmin } from '../middlewares/admin.midleware';

const userRoutes = Router();
const userRepository = new UserRepository();

userRoutes.post('/cadastro-cliente', (request, response) => {

    userRepository.createCliente(request, response)
   
});

userRoutes.post(
    '/cadastro-admin',
    authMiddleware,
    somenteAdmin,
    (request, response) => {

       return userRepository.createAdmin(request, response)

    });

userRoutes.post('/entrar', (request, response) => {

    userRepository.login(request, response)
    
});

userRoutes.get(
    '/perfil',
    authMiddleware,
    (request, response) => {

       return userRepository.getPerfil(request, response)

    });


export { userRoutes };