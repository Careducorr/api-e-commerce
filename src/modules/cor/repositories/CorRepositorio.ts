import { Request, Response } from 'express';
import { pool } from '../../../mysql';

class CorRepository {

    cadastroCor(request: Request, response: Response) {

        const { cor, id_produto } = request.body;

        // Validação da cor
        if (cor === undefined || cor === null || typeof cor !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Digite uma cor válida'
            });
        }

        //padronizar
        const corNormalizada = cor.trim().toLowerCase();

        if (
            id_produto === undefined ||
            id_produto === null ||
            !Number.isInteger(Number(id_produto))
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_produto não é válido'
            });
        }

        //valdação id_produto
        if (!Number.isInteger(Number(id_produto))) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_produto não é válido'
            });
        }


        pool.getConnection((error, connection) => {

            if (error) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar ao banco de dados',
                    erro: error.message
                });
            }


            connection.query(

                `INSERT INTO cor
                (nome_cor, id_produto)
            VALUES
                (?, ?)
            ON DUPLICATE KEY UPDATE
                id_cor = LAST_INSERT_ID(id_cor)`,
                [corNormalizada, id_produto],
                (error: any, result: any) => {

                    connection.release();

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao cadastrar cor',
                            erro: error.message
                        });
                    }

                    return response.status(201).json({
                        sucesso: true,
                        mensagem: 'Cor cadastrada com sucesso',
                        id_cor: result.insertId
                    });
                }
            );
        });
    };

    //editar o nome de uma cor existente
    editarCor(request: Request, response: Response) {

        const { id_cor } = request.params;
        const { cor } = request.body;

        // Validação do id_cor
        if (
            id_cor === undefined ||
            id_cor === null ||
            !Number.isInteger(Number(id_cor))
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_cor não é válido'
            });
        }

        // Validação da cor
        if (
            cor === undefined ||
            cor === null ||
            typeof cor !== 'string' ||
            cor.trim() === ''
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Digite uma cor válida'
            });
        }

        // Padronizar
        const corNormalizada = cor.trim().toLowerCase();

        pool.getConnection((error, connection) => {

            if (error) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar ao banco de dados',
                    erro: error.message
                });
            }

            connection.query(
                `
            UPDATE cor
            SET nome_cor = ?
            WHERE id_cor = ?
            `,
                [corNormalizada, Number(id_cor)],

                (error: any, result: any) => {

                    connection.release();

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao editar cor',
                            erro: error.message
                        });
                    }

                    if (result.affectedRows === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Cor não encontrada'
                        });
                    }

                    return response.status(200).json({
                        sucesso: true,
                        mensagem: 'Cor editada com sucesso',
                        id_cor: Number(id_cor),
                        cor: corNormalizada
                    });
                }
            );
        });
    };

    //busca todas as cores de um produto
    buscarCoresPorProduto(request: Request, response: Response) {

        const { id_produto } = request.params;

        // Validação do id_produto
        if (
            id_produto === undefined ||
            id_produto === null ||
            !Number.isInteger(Number(id_produto))
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_produto não é válido'
            });
        }

        pool.getConnection((error, connection) => {

            if (error) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar ao banco de dados',
                    erro: error.message
                });
            }

            connection.query(
                `
            SELECT
                id_cor,
                nome_cor,
                id_produto
            FROM cor
            WHERE id_produto = ?
            ORDER BY nome_cor ASC
            `,
                [Number(id_produto)],

                (error: any, result: any) => {

                    connection.release();

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao buscar cores',
                            erro: error.message
                        });
                    }

                    return response.status(200).json({
                        sucesso: true,
                        mensagem: 'Cores encontradas com sucesso',
                        cores: result
                    });
                }
            );
        });
    };

    //deletar uma cor
    deletarCor(request: Request, response: Response) {

        const { id_cor } = request.params;

        // Validação do id_cor
        if (
            id_cor === undefined ||
            id_cor === null ||
            !Number.isInteger(Number(id_cor))
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_cor não é válido'
            });
        }

        pool.getConnection((error, connection) => {

            if (error) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar ao banco de dados',
                    erro: error.message
                });
            }

            connection.query(
                `
            DELETE FROM cor
            WHERE id_cor = ?
            `,
                [Number(id_cor)],

                (error: any, result: any) => {

                    connection.release();

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao deletar cor',
                            erro: error.message
                        });
                    }

                    if (result.affectedRows === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Cor não encontrada'
                        });
                    }

                    return response.status(200).json({
                        sucesso: true,
                        mensagem: 'Cor deletada com sucesso',
                        id_cor: Number(id_cor)
                    });
                }
            );
        });
    };

}


export { CorRepository };