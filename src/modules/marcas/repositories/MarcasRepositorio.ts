import { pool } from '../../../mysql';
import { Request, Response } from 'express';

class MarcasRepository {

    create(request: Request, response: Response) {

        const { nome } = request.body;

        // ID do usuário que veio do JWT
        const id_usuario = (request as any).usuario.id_usuario;

        // Validação
        if (!nome || typeof nome !== 'string' || nome.trim() === '') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O nome da marca é obrigatório'
            });
        }

        pool.getConnection((err: any, connection: any) => {

            if (err) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar com o banco',
                    erro: err.message
                });
            }

            connection.query(
                `INSERT INTO marcas 
                (nome, id_usuario) 
                VALUES (?, ?)`,
                [
                    nome.trim(),
                    id_usuario
                ],
                (error: any, result: any) => {

                    connection.release();

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao cadastrar marca',
                            erro: error.message
                        });
                    }

                    return response.status(201).json({
                        sucesso: true,
                        mensagem: 'Marca cadastrada com sucesso',
                        id_marca: result.insertId
                    });
                }
            );
        });
    }

    deleteMarca(request: Request, response: Response) {

        const { id_marca } = request.params;

        // Validação do ID
        if (
            !id_marca ||
            !Number.isInteger(Number(id_marca))
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_marca não é válido'
            });
        }

        pool.getConnection((err: any, connection: any) => {

            if (err) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar com o banco',
                    erro: err.message
                });
            }

            // Verifica se a marca existe e se possui produtos
            connection.query(
                `SELECT 
                m.id_marca,
                COUNT(p.id_produto) AS quantidade_produtos
             FROM marcas m
             LEFT JOIN produtos p
                ON p.id_marca = m.id_marca
             WHERE m.id_marca = ?
             GROUP BY m.id_marca`,
                [Number(id_marca)],

                (error: any, result: any[]) => {

                    if (error) {
                        connection.release();

                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao verificar marca',
                            erro: error.message
                        });
                    }

                    // Marca não existe
                    if (result.length === 0) {
                        connection.release();

                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Marca não encontrada'
                        });
                    }

                    // Marca possui produtos
                    if (Number(result[0].quantidade_produtos) > 0) {
                        connection.release();

                        return response.status(409).json({
                            sucesso: false,
                            mensagem: 'Não é possível excluir a marca porque existem produtos cadastrados com ela'
                        });
                    }

                    // Marca existe e não possui produtos
                    connection.query(
                        `DELETE FROM marcas
                     WHERE id_marca = ?`,
                        [Number(id_marca)],

                        (errorDelete: any, resultDelete: any) => {

                            connection.release();

                            if (errorDelete) {
                                return response.status(500).json({
                                    sucesso: false,
                                    mensagem: 'Erro ao excluir marca',
                                    erro: errorDelete.message
                                });
                            }

                            return response.status(200).json({
                                sucesso: true,
                                mensagem: 'Marca excluída com sucesso'
                            });
                        }
                    );
                }
            );
        });
    }

    updateMarca(request: Request, response: Response) {

        const { id_marca } = request.params;
        const { nome } = request.body;

        // Validação do ID
        if (
            !id_marca ||
            !Number.isInteger(Number(id_marca))
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_marca não é válido'
            });
        }

        // Validação do nome
        if (
            !nome ||
            typeof nome !== 'string' ||
            nome.trim() === ''
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O nome da marca é obrigatório'
            });
        }

        const nomeNormalizado = nome.trim();

        pool.getConnection((err: any, connection: any) => {

            if (err) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar ao banco',
                    erro: err.message
                });
            }

            // Atualiza e verifica se a marca existe
            connection.query(
                `UPDATE marcas
             SET nome = ?
             WHERE id_marca = ?`,
                [nomeNormalizado, Number(id_marca)],

                (error: any, result: any) => {

                    connection.release();

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao atualizar marca',
                            erro: error.message
                        });
                    }

                    // Marca não existe
                    if (result.affectedRows === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Marca não encontrada'
                        });
                    }

                    return response.status(200).json({
                        sucesso: true,
                        mensagem: 'Marca atualizada com sucesso',
                        id_marca: Number(id_marca),
                        nome: nomeNormalizado
                    });
                }
            );
        });
    }

    // buscando produto por marca
    getProdutosPorMarca(request: Request, response: Response) {

        const { id_marca } = request.body;

        // Validação
        if (
            id_marca === undefined ||
            id_marca === null ||
            !Number.isInteger(Number(id_marca))
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_marca não é válido'
            });
        }

        pool.getConnection((err: any, connection: any) => {

            if (err) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar com o banco',
                    erro: err.message
                });
            }

            connection.query(
                `SELECT p.*
             FROM produtos p
             INNER JOIN marcas m
                 ON m.id_marca = p.id_marca
             WHERE m.id_marca = ?`,
                [id_marca],

                (error: any, result: any[]) => {

                    connection.release();

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao buscar produtos',
                            erro: error.message
                        });
                    }

                    if (result.length === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Nenhum produto encontrado para essa marca'
                        });
                    }

                    return response.status(200).json({
                        sucesso: true,
                        mensagem: 'Produtos encontrados',
                        produtos: result
                    });
                }
            );
        });
    }

    getMarcas(request: Request, response: Response) {

        pool.getConnection((err: any, connection: any) => {

            if (err) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar ao banco',
                    erro: err.message
                });
            }

            connection.query(
                `SELECT *
             FROM marcas
             ORDER BY nome ASC`,

                (error: any, result: any[]) => {

                    connection.release();

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao buscar marcas',
                            erro: error.message
                        });
                    }

                    if (result.length === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Nenhuma marca cadastrada'
                        });
                    }

                    return response.status(200).json({
                        sucesso: true,
                        mensagem: 'Marcas encontradas',
                        marcas: result
                    });
                }
            );
        });
    }

}

export { MarcasRepository };