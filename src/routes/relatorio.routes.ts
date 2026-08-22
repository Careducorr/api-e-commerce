import { Router } from "express";
import { RelatorioRepository } from "../modules/relatorios/repositories/RelatoriosRepositorio";
import { authMiddleware } from "../middlewares/auth.midleware";
import { somenteAdmin } from "../middlewares/admin.midleware";

const relatorioRoutes = Router();

const relatorioRepository = new RelatorioRepository();

relatorioRoutes.get(
    '/estoque',
    authMiddleware,
    somenteAdmin,

    (request, response) => {

        return relatorioRepository.getRelatorioEstoque(request, response)

    });

relatorioRoutes.get(
    '/clientes',
    authMiddleware,
    somenteAdmin,

    (request, response) => {

        return relatorioRepository.getRelatorioClientes(request, response)

    });

relatorioRoutes.get(
    '/compras',
    authMiddleware,
    somenteAdmin,

    (request, response) => {

        return relatorioRepository.getRelatorioCompras(request, response)

    });

export { relatorioRoutes };