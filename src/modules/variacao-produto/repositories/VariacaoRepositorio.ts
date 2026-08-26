import { pool } from '../../../mysql';
import { Request, Response } from 'express';

class VariacaoRepository {

    //cadastro de tamanho e quantidade
    cadastroVariacao(request: Request, response: Response) {

        const { tamanho, quantidade, id_cor, id_produto } = request.body;

        // ID do usuário que veio do JWT
        const id_usuario = (request as any).usuario.id_usuario;

        // Validação do tamanho
        if (!Number.isInteger(tamanho) || tamanho <= 0) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe um tamanho válido'
            });
        }

        // Validação da quantidade
        if (!Number.isInteger(quantidade) || quantidade <= 0) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe uma quantidade válida'
            });
        }

        // Validação do id cor
        if (!Number.isInteger(id_cor) || id_cor <= 0) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Cor inválida'
            });
        }

        // Validação do produto
        if (!Number.isInteger(id_produto) || id_produto <= 0) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Produto inválido'
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
                `INSERT INTO variacao_produto 
                (tamanho, quantidade, id_cor, id_produto, id_usuario) 
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                quantidade = quantidade + VALUES(quantidade)`,
                [
                    tamanho,
                    quantidade,
                    id_cor,
                    id_produto,
                    id_usuario
                ],
                (error: any, result: any) => {

                    connection.release();

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao cadastrar variação',
                            erro: error.message
                        });
                    }

                    return response.status(201).json({
                        sucesso: true,
                        mensagem: 'Variação cadastrada com sucesso',
                        id_variacao_produto: result.insertId
                    });
                }
            );
        });
    }

    updateVariacao(request: Request, response: Response) {

        const { id_variacao_produto } = request.params;

        const {
            tamanho,
            quantidade,
            id_cor,
            id_produto
        } = request.body;

        // Validação do ID da variação
        if (
            !id_variacao_produto ||
            !Number.isInteger(Number(id_variacao_produto)) ||
            Number(id_variacao_produto) <= 0
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_variacao_produto não é válido'
            });
        }

        // Verifica se pelo menos um campo foi enviado
        if (
            tamanho === undefined &&
            quantidade === undefined &&
            id_cor === undefined &&
            id_produto === undefined
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe pelo menos um campo para atualizar'
            });
        }

        // Validação do tamanho
        if (
            tamanho !== undefined &&
            (
                !Number.isInteger(Number(tamanho)) ||
                Number(tamanho) <= 0
            )
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe um tamanho válido'
            });
        }

        // Validação da quantidade
        if (
            quantidade !== undefined &&
            (
                !Number.isInteger(Number(quantidade)) ||
                Number(quantidade) < 0
            )
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe uma quantidade válida'
            });
        }

        // Validação da cor
        if (
            id_cor !== undefined &&
            (
                !Number.isInteger(Number(id_cor)) ||
                Number(id_cor) <= 0
            )
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Cor inválida'
            });
        }

        // Validação do produto
        if (
            id_produto !== undefined &&
            (
                !Number.isInteger(Number(id_produto)) ||
                Number(id_produto) <= 0
            )
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Produto inválido'
            });
        }

        // Monta o UPDATE dinamicamente
        const campos: string[] = [];
        const valores: any[] = [];

        if (tamanho !== undefined) {
            campos.push('tamanho = ?');
            valores.push(Number(tamanho));
        }

        if (quantidade !== undefined) {
            campos.push('quantidade = ?');
            valores.push(Number(quantidade));
        }

        if (id_cor !== undefined) {
            campos.push('id_cor = ?');
            valores.push(Number(id_cor));
        }

        if (id_produto !== undefined) {
            campos.push('id_produto = ?');
            valores.push(Number(id_produto));
        }

        valores.push(Number(id_variacao_produto));

        pool.getConnection((err: any, connection: any) => {

            if (err) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar com o banco',
                    erro: err.message
                });
            }

            connection.query(
                `UPDATE variacao_produto
             SET ${campos.join(', ')}
             WHERE id_variacao_produto = ?`,
                valores,

                (error: any, result: any) => {

                    connection.release();

                    if (error) {

                        // Combinação produto + cor + tamanho já existe
                        if (error.code === 'ER_DUP_ENTRY') {
                            return response.status(409).json({
                                sucesso: false,
                                mensagem: 'Já existe uma variação com esse produto, cor e tamanho'
                            });
                        }

                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao atualizar variação',
                            erro: error.message
                        });
                    }

                    if (result.affectedRows === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Variação não encontrada'
                        });
                    }

                    return response.status(200).json({
                        sucesso: true,
                        mensagem: 'Variação atualizada com sucesso',
                        id_variacao_produto: Number(id_variacao_produto)
                    });
                }
            );
        });
    }

    // buscando as variações de um produto e de uma cor específica
    getVariacoesPorProduto(request: Request, response: Response) {

        const { id_produto, id_cor } = request.params;

        // Validação dos IDs
        if (
            !id_produto ||
            !Number.isInteger(Number(id_produto)) ||
            Number(id_produto) <= 0
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_produto não é válido'
            });
        }

        if (
            !id_cor ||
            !Number.isInteger(Number(id_cor)) ||
            Number(id_cor) <= 0
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_cor não é válido'
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
                `SELECT 
                vp.id_variacao_produto,
                vp.tamanho,
                vp.quantidade,
                vp.id_cor,
                vp.id_produto,
                vp.id_usuario,
                vp.data_cadastro,
                fp.id_foto,
                fp.url,
                fp.ordem

            FROM variacao_produto vp

            INNER JOIN fotos_produto fp
                ON fp.id_produto = vp.id_produto
                AND fp.id_cor = vp.id_cor

            WHERE vp.id_produto = ?
            AND vp.id_cor = ?

            ORDER BY vp.tamanho ASC, fp.ordem ASC`,

                [
                    Number(id_produto),
                    Number(id_cor)
                ],

                (error: any, result: any[]) => {

                    connection.release();

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao buscar variações',
                            erro: error.message
                        });
                    }

                    if (result.length === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Nenhuma variação encontrada para este produto e esta cor'
                        });
                    }

                    return response.status(200).json({
                        sucesso: true,
                        mensagem: 'Variações encontradas',
                        variacoes: result
                    });
                }
            );
        });
    }

    //deletar uma variação
    deleteVariacao(request: Request, response: Response) {

        const { id_variacao_produto } = request.params;

        // Validação do ID
        if (
            !id_variacao_produto ||
            !Number.isInteger(Number(id_variacao_produto)) ||
            Number(id_variacao_produto) <= 0
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_variacao_produto não é válido'
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
                `DELETE FROM variacao_produto
             WHERE id_variacao_produto = ?`,
                [Number(id_variacao_produto)],

                (error: any, result: any) => {

                    connection.release();

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao excluir variação',
                            erro: error.message
                        });
                    }

                    // Variação não encontrada
                    if (result.affectedRows === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Variação não encontrada'
                        });
                    }

                    return response.status(200).json({
                        sucesso: true,
                        mensagem: 'Variação excluída com sucesso',
                        id_variacao_produto: Number(id_variacao_produto)
                    });
                }
            );
        });
    }

    // =====================================================
    // BUSCAR PRODUTOS COM COR, MAS SEM VARIAÇÃO CADASTRADA
    // =====================================================

    getProdutosSemVariacao(request: Request, response: Response) {

        pool.getConnection((err: any, connection: any) => {

            // =====================================================
            // ERRO AO CONECTAR AO BANCO
            // =====================================================

            if (err) {

                return response.status(500).json({

                    sucesso: false,

                    mensagem:
                        'Erro ao conectar ao banco',

                    erro:
                        err.message

                });

            }


            // =====================================================
            // BUSCAR PRODUTOS
            // =====================================================

            connection.query(

                `
           SELECT
            p.id_produto,
            p.nome_produto,
            p.descricao,
            p.preco,
            p.id_marca,

            c.id_cor,
            c.nome_cor,

            fp.id_foto,
            fp.url AS url_foto_principal,
            fp.ordem

        FROM produtos p

        INNER JOIN cor c
            ON c.id_produto = p.id_produto

        LEFT JOIN fotos_produto fp
            ON fp.id_foto = (
                SELECT f.id_foto
                FROM fotos_produto f
                WHERE f.id_produto = p.id_produto
                AND f.id_cor = c.id_cor
                ORDER BY f.ordem ASC
                LIMIT 1
            )

        WHERE NOT EXISTS (
            SELECT 1
            FROM variacao_produto v
            WHERE v.id_produto = p.id_produto
        )

        ORDER BY
            p.nome_produto ASC,
            c.nome_cor ASC;
            `,

                (error: any, result: any[]) => {

                    // =====================================================
                    // LIBERAR CONEXÃO
                    // =====================================================

                    connection.release();


                    // =====================================================
                    // ERRO NA CONSULTA
                    // =====================================================

                    if (error) {

                        return response.status(500).json({

                            sucesso: false,

                            mensagem:
                                'Erro ao buscar produtos sem variação',

                            erro:
                                error.message

                        });

                    }


                    // =====================================================
                    // NENHUM PRODUTO ENCONTRADO
                    // =====================================================

                    if (result.length === 0) {

                        return response.status(200).json({

                            sucesso: true,

                            mensagem:
                                'Nenhum produto sem variação encontrado',

                            produtos: []

                        });

                    }


                    // =====================================================
                    // SUCESSO
                    // =====================================================

                    return response.status(200).json({

                        sucesso: true,

                        mensagem:
                            'Produtos sem variação encontrados com sucesso',

                        produtos:
                            result

                    });

                }

            );

        });

    };
}

export { VariacaoRepository };