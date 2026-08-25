import { pool } from '../../../mysql';
import { Request, Response } from 'express';

class ProductRepository {

    create(request: Request, response: Response) {

        const { nome_produto, descricao, preco, id_marca } = request.body;

        // ID do usuário que veio do JWT
        const id_usuario = (request as any).usuario.id_usuario;

        pool.getConnection((err: any, connection: any) => {

            // Erro ao conectar no MySQL
            if (err) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar com o banco',
                    erro: err.message
                });
            }

            // Insere o produto
            connection.query(
                `INSERT INTO produtos 
                (id_usuario, nome_produto, descricao, preco, id_marca) 
                VALUES (?, ?, ?, ?, ?)`,
                [
                    id_usuario,
                    nome_produto,
                    descricao,
                    preco,
                    id_marca
                ],
                (error: any, result: any) => {

                    connection.release();

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao cadastrar produto',
                            erro: error.message
                        });
                    }

                    return response.status(201).json({
                        sucesso: true,
                        mensagem: 'Produto cadastrado com sucesso',
                        id_produto: result.insertId
                    });
                }
            );
        });
    }


    //editar produto
    updateProduto(request: Request, response: Response) {

        const { id_produto } = request.params;

        const {
            nome_produto,
            descricao,
            preco,
            id_marca
        } = request.body;

        // Validação do ID
        if (
            !id_produto ||
            !Number.isInteger(Number(id_produto))
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_produto não é válido'
            });
        }

        // Verifica se pelo menos um campo foi enviado
        if (
            nome_produto === undefined &&
            descricao === undefined &&
            preco === undefined &&
            id_marca === undefined
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe pelo menos um campo para atualizar'
            });
        }

        // Validação do nome
        if (
            nome_produto !== undefined &&
            (
                typeof nome_produto !== 'string' ||
                nome_produto.trim() === ''
            )
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O nome do produto não é válido'
            });
        }

        // Validação da descrição
        if (
            descricao !== undefined &&
            typeof descricao !== 'string'
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'A descrição do produto não é válida'
            });
        }

        // Validação do preço
        if (
            preco !== undefined &&
            (
                preco === null ||
                isNaN(Number(preco)) ||
                Number(preco) < 0
            )
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O preço não é válido'
            });
        }

        // Validação da marca
        if (
            id_marca !== undefined &&
            !Number.isInteger(Number(id_marca))
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_marca não é válido'
            });
        }

        // Monta o UPDATE dinamicamente
        const campos: string[] = [];
        const valores: any[] = [];

        if (nome_produto !== undefined) {
            campos.push('nome_produto = ?');
            valores.push(nome_produto.trim());
        }

        if (descricao !== undefined) {
            campos.push('descricao = ?');
            valores.push(descricao.trim());
        }

        if (preco !== undefined) {
            campos.push('preco = ?');
            valores.push(Number(preco));
        }

        if (id_marca !== undefined) {
            campos.push('id_marca = ?');
            valores.push(Number(id_marca));
        }

        valores.push(Number(id_produto));

        pool.getConnection((err: any, connection: any) => {

            if (err) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar com o banco',
                    erro: err.message
                });
            }

            connection.query(
                `UPDATE produtos
             SET ${campos.join(', ')}
             WHERE id_produto = ?`,
                valores,

                (error: any, result: any) => {

                    connection.release();

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao atualizar produto',
                            erro: error.message
                        });
                    }

                    if (result.affectedRows === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Produto não encontrado'
                        });
                    }

                    return response.status(200).json({
                        sucesso: true,
                        mensagem: 'Produto atualizado com sucesso',
                        id_produto: Number(id_produto)
                    });
                }
            );
        });
    }

    // buscando todos os produtos
    getTodosProdutos(request: Request, response: Response) {

        pool.getConnection((err: any, connection: any) => {

            if (err) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar com o banco',
                    erro: err.message
                });
            }

            connection.query(
                `SELECT
                    p.id_produto,

                    fp.url AS foto_principal,

                    p.nome_produto AS produto,

                    m.nome AS marca,

                    vp.quantidade,

                    vp.tamanho,

                    p.preco AS valor,

                    c.nome_cor AS cor,

                    u.nome AS cadastrado_por

                FROM produtos p

                INNER JOIN marcas m
                    ON m.id_marca = p.id_marca

                INNER JOIN variacao_produto vp
                    ON vp.id_produto = p.id_produto

                INNER JOIN cor c
                    ON c.id_cor = vp.id_cor
                    AND c.id_produto = p.id_produto

                LEFT JOIN fotos_produto fp
                    ON fp.id_produto = p.id_produto
                    AND fp.id_cor = c.id_cor
                    AND fp.ordem = 1

                INNER JOIN usuarios u
                    ON u.id_usuario = p.id_usuario

                ORDER BY
                    p.id_produto DESC,
                    c.id_cor ASC,
                    vp.tamanho ASC;`,

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
                            mensagem: 'Nenhum produto cadastrado'
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


    // buscando produto por nome
    getProdutos(request: Request, response: Response) {

        const { nome_produto } = request.body;

        if (!nome_produto || typeof nome_produto !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe um nome de produto para busca'
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
                `SELECT *
             FROM produtos
             WHERE nome_produto LIKE ?`,
                [`%${nome_produto.trim()}%`],

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
                            mensagem: 'Produto não encontrado'
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

    // buscando produtos por cores
    getCores(request: Request, response: Response) {

        const { nome_cor } = request.body;

        if (!nome_cor || typeof nome_cor !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe uma cor para busca'
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
                `SELECT DISTINCT p.*
             FROM produtos p
             INNER JOIN cor c
                 ON c.id_produto = p.id_produto
             WHERE c.nome_cor LIKE ?`,
                [`%${nome_cor.trim()}%`],

                (error: any, result: any[]) => {

                    connection.release();

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao buscar produtos por cor',
                            erro: error.message
                        });
                    }

                    if (result.length === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Nenhum produto encontrado para essa cor'
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

    // buscando produtos por tamanho
    getTamanho(request: Request, response: Response) {

        const { tamanho } = request.body;

        if (
            tamanho === undefined ||
            tamanho === null ||
            !Number.isInteger(Number(tamanho))
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe um tamanho válido'
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
                `SELECT DISTINCT p.*
                FROM produtos p
                INNER JOIN variacao_produto c
                ON c.id_produto = p.id_produto
                WHERE c.tamanho = ?`,
                [tamanho],

                (error: any, result: any[]) => {

                    connection.release();

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao buscar produtos por tamanho',
                            erro: error.message
                        });
                    }

                    if (result.length === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Nenhum produto encontrado para este tamanho'
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

    //deletar produto
    deleteProduto(request: Request, response: Response) {

        const { id_produto } = request.params;

        // Validação do ID
        if (
            !id_produto ||
            !Number.isInteger(Number(id_produto))
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_produto não é válido'
            });
        }

        pool.getConnection((err: any, connection: any) => {

            if (err) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar ao banco',
                    erro: err.message
                });
            }

            connection.query(
                `DELETE FROM produtos
             WHERE id_produto = ?`,
                [Number(id_produto)],

                (error: any, result: any) => {

                    connection.release();

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao excluir produto',
                            erro: error.message
                        });
                    }

                    // Produto não encontrado
                    if (result.affectedRows === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Produto não encontrado'
                        });
                    }

                    return response.status(200).json({
                        sucesso: true,
                        mensagem: 'Produto excluído com sucesso',
                        id_produto: Number(id_produto)
                    });
                }
            );
        });
    }

}


export { ProductRepository };