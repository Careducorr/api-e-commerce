import { pool } from "../../../mysql";
import { Request, Response } from "express";

class RelatorioRepository {

    getRelatorioEstoque(request: Request, response: Response) {

        pool.getConnection((err: any, connection: any) => {

            // ==========================================
            // ERRO AO CONECTAR
            // ==========================================

            if (err) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar ao banco',
                    erro: err.message
                });
            }

            // ==========================================
            // BUSCA RELATÓRIO
            // ==========================================

            connection.query(
                `
                SELECT
                    p.id_produto,
                    p.nome_produto AS produto,
                    m.nome AS marca,
                    c.nome_cor AS cor,
                    vp.tamanho,
                    vp.quantidade AS estoque,
                    p.preco AS valor,
                    vp.data_cadastro,

                    u.id_usuario,
                    u.nome AS usuario_cadastro,

                    SUM(vp.quantidade) OVER() AS estoque_total

                FROM variacao_produto vp

                INNER JOIN produtos p
                    ON p.id_produto = vp.id_produto

                INNER JOIN marcas m
                    ON m.id_marca = p.id_marca

                INNER JOIN cor c
                    ON c.id_cor = vp.id_cor

                INNER JOIN usuarios u
                    ON u.id_usuario = p.id_usuario

                ORDER BY
                    m.nome ASC,
                    p.nome_produto ASC,
                    c.nome_cor ASC,
                    vp.tamanho ASC
                `,
                (error: any, result: any[]) => {

                    connection.release();

                    // ==========================================
                    // ERRO NA CONSULTA
                    // ==========================================

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao gerar relatório de estoque',
                            erro: error.message
                        });
                    }

                    // ==========================================
                    // NENHUM RESULTADO
                    // ==========================================

                    if (result.length === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Nenhuma informação de estoque encontrada'
                        });
                    }

                    // ==========================================
                    // ESTOQUE TOTAL
                    // ==========================================

                    const estoqueTotal = Number(
                        result[0].estoque_total
                    );

                    // ==========================================
                    // MONTA RELATÓRIO
                    // ==========================================

                    const relatorio = result.map((item: any) => ({
                        id_produto: item.id_produto,
                        produto: item.produto,
                        marca: item.marca,
                        cor: item.cor,
                        tamanho: item.tamanho,
                        estoque: Number(item.estoque),
                        valor: Number(item.valor),
                        data_cadastro: item.data_cadastro,

                        id_usuario: item.id_usuario,
                        usuario_cadastro: item.usuario_cadastro
                    }));

                    // ==========================================
                    // RESPOSTA
                    // ==========================================

                    return response.status(200).json({
                        sucesso: true,
                        mensagem: 'Relatório de estoque gerado com sucesso',
                        estoque_total: estoqueTotal,
                        relatorio: relatorio
                    });
                }
            );
        });
    }


    getRelatorioClientes(request: Request, response: Response) {

        pool.getConnection((err: any, connection: any) => {

            // ==========================================
            // ERRO AO CONECTAR
            // ==========================================

            if (err) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar ao banco',
                    erro: err.message
                });
            }

            // ==========================================
            // BUSCA RELATÓRIO
            // ==========================================

            connection.query(
                `
            SELECT
                u.id_usuario AS cliente_id,
                u.nome AS usuario,

                COUNT(c.id_compra) AS total_compras,

                CONCAT(
                    e.rua, ', ',
                    e.numero, ' - ',
                    e.bairro, ' - ',
                    e.cidade, '/',
                    e.estado, ' - CEP: ',
                    e.cep
                ) AS endereco

            FROM usuarios u

            LEFT JOIN compra c
                ON c.id_usuario = u.id_usuario

            LEFT JOIN endereco e
                ON e.id_usuario = u.id_usuario

            WHERE u.acesso = 'cliente'

            GROUP BY
                u.id_usuario,
                u.nome,
                e.id_endereco,
                e.rua,
                e.numero,
                e.bairro,
                e.cidade,
                e.estado,
                e.cep

            ORDER BY
                u.nome ASC
            `,
                (error: any, result: any[]) => {

                    connection.release();

                    // ==========================================
                    // ERRO NA CONSULTA
                    // ==========================================

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao gerar relatório de clientes',
                            erro: error.message
                        });
                    }

                    // ==========================================
                    // NENHUM RESULTADO
                    // ==========================================

                    if (result.length === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Nenhum cliente cadastrado'
                        });
                    }

                    // ==========================================
                    // MONTA RELATÓRIO
                    // ==========================================

                    const relatorio = result.map((item: any) => ({
                        cliente_id: item.cliente_id,
                        usuario: item.usuario,
                        total_compras: Number(item.total_compras),
                        endereco: item.endereco
                    }));

                    // ==========================================
                    // RESPOSTA
                    // ==========================================

                    return response.status(200).json({
                        sucesso: true,
                        mensagem: 'Relatório de clientes gerado com sucesso',
                        total_clientes: result.length,
                        relatorio: relatorio
                    });
                }
            );
        });
    }

    getRelatorioCompras(request: Request, response: Response) {

        pool.getConnection((err: any, connection: any) => {

            // ==========================================
            // ERRO AO CONECTAR
            // ==========================================

            if (err) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar ao banco',
                    erro: err.message
                });
            }

            // ==========================================
            // BUSCA RELATÓRIO
            // ==========================================

            connection.query(
                `
                SELECT

                    c.id_compra,

                    COUNT(ic.id_item_compra) AS total_itens,

                    SUM(ic.quantidade * ic.preco_unitario) AS valor_total,

                    u.nome AS cliente,

                    c.cidade AS cidade_envio,

                    c.estado AS estado_envio,

                    c.status AS status

                FROM compra c

                INNER JOIN usuarios u
                    ON u.id_usuario = c.id_usuario

                LEFT JOIN item_compra ic
                    ON ic.id_compra = c.id_compra

                GROUP BY
                    c.id_compra,
                    u.id_usuario,
                    u.nome,
                    c.cidade,
                    c.estado,
                    c.status

                ORDER BY
                    c.id_compra DESC
                `,
                (error: any, result: any[]) => {

                    connection.release();

                    // ==========================================
                    // ERRO NA CONSULTA
                    // ==========================================

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao gerar relatório de compras',
                            erro: error.message
                        });
                    }

                    // ==========================================
                    // NENHUM RESULTADO
                    // ==========================================

                    if (result.length === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Nenhuma compra encontrada'
                        });
                    }

                    // ==========================================
                    // MONTA RELATÓRIO
                    // ==========================================

                    const relatorio = result.map((item: any) => ({
                        id_compra: item.id_compra,
                        total_itens: Number(item.total_itens),
                        valor_total: Number(item.valor_total),
                        cliente: item.cliente,
                        cidade_envio: item.cidade_envio,
                        estado_envio: item.estado_envio,
                        status: item.status
                    }));

                    // ==========================================
                    // RESPOSTA
                    // ==========================================

                    return response.status(200).json({
                        sucesso: true,
                        mensagem: 'Relatório de compras gerado com sucesso',
                        numero_compras: result.length,
                        relatorio: relatorio
                    });
                }
            );
        });
    }
}

export { RelatorioRepository };