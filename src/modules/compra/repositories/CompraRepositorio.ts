import { poolPromise } from '../../../mysql';
import { Request, Response } from 'express';

class CompraRepository {

    async compraIniciada(request: Request, response: Response) {

        const usuario = (request as any).usuario;

        // ==========================================
        // VERIFICA USUÁRIO DO JWT
        // ==========================================

        if (!usuario || !usuario.id_usuario) {
            return response.status(401).json({
                sucesso: false,
                mensagem: 'Usuário não identificado ou token inválido'
            });
        }

        const id_usuario = usuario.id_usuario;

        const {
            cep,
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            itens
        } = request.body;

        // ==========================================
        // VALIDAÇÕES
        // ==========================================

        if (!cep || typeof cep !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe um CEP válido'
            });
        }

        if (!logradouro || typeof logradouro !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe o logradouro'
            });
        }

        if (!numero || typeof numero !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe o número'
            });
        }

        if (!bairro || typeof bairro !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe o bairro'
            });
        }

        if (!cidade || typeof cidade !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe a cidade'
            });
        }

        if (!estado || typeof estado !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe o estado'
            });
        }

        if (!Array.isArray(itens) || itens.length === 0) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'A compra precisa possuir pelo menos um item'
            });
        }

        // ==========================================
        // VALIDA OS ITENS
        // ==========================================

        for (const item of itens) {

            if (
                !Number.isInteger(Number(item.id_variacao_produto)) ||
                Number(item.id_variacao_produto) <= 0
            ) {
                return response.status(400).json({
                    sucesso: false,
                    mensagem: 'id_variacao_produto inválido'
                });
            }

            if (
                !Number.isInteger(Number(item.quantidade)) ||
                Number(item.quantidade) <= 0
            ) {
                return response.status(400).json({
                    sucesso: false,
                    mensagem: 'A quantidade deve ser maior que zero'
                });
            }
        }

        // ==========================================
        // PEGA CONEXÃO
        // ==========================================

        let connection;

        try {

            connection = await poolPromise.getConnection();

            // ==========================================
            // INICIA TRANSACTION
            // ==========================================

            await connection.beginTransaction();

            // ==========================================
            // CRIA A COMPRA
            // ==========================================

            const [resultadoCompra]: any = await connection.query(
                `
    INSERT INTO compra
    (
        data,
        valor_total,
        status,
        id_usuario,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado
    )
    VALUES
    (
        NOW(),
        0,
        'aguardando pagamento',
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
    )
    `,
                [
                    id_usuario,
                    cep.trim(),
                    logradouro.trim(),
                    numero.trim(),
                    complemento ? complemento.trim() : null,
                    bairro.trim(),
                    cidade.trim(),
                    estado.trim()
                ]
            );

            const id_compra = resultadoCompra.insertId;

            // ==========================================
            // VALOR TOTAL
            // ==========================================

            let valorTotal = 0;

            // ==========================================
            // PROCESSA CADA ITEM
            // ==========================================

            for (const item of itens) {

                const id_variacao_produto =
                    Number(item.id_variacao_produto);

                const quantidadeCompra =
                    Number(item.quantidade);

                // ------------------------------------------
                // BUSCA PRODUTO + ESTOQUE + PREÇO
                // ------------------------------------------

                const [resultadoVariacao]: any = await connection.query(
                    `
                    SELECT
                        vp.id_variacao_produto,
                        vp.quantidade AS estoque,
                        p.preco
                    FROM variacao_produto vp
                    INNER JOIN produtos p
                        ON p.id_produto = vp.id_produto
                    WHERE vp.id_variacao_produto = ?
                    FOR UPDATE
                    `,
                    [id_variacao_produto]
                );

                // ------------------------------------------
                // VERIFICA SE EXISTE
                // ------------------------------------------

                if (resultadoVariacao.length === 0) {

                    throw new Error(
                        `Variação ${id_variacao_produto} não encontrada`
                    );
                }

                const variacao = resultadoVariacao[0];

                // ------------------------------------------
                // VERIFICA ESTOQUE
                // ------------------------------------------

                if (variacao.estoque < quantidadeCompra) {

                    throw new Error(
                        `Estoque insuficiente para a variação ${id_variacao_produto}`
                    );
                }

                // ------------------------------------------
                // CALCULA PREÇO
                // ------------------------------------------

                const precoUnitario =
                    Number(variacao.preco);

                const subtotal =
                    precoUnitario * quantidadeCompra;

                valorTotal += subtotal;

                // ------------------------------------------
                // INSERE ITEM DA COMPRA
                // ------------------------------------------

                await connection.query(
                    `
                    INSERT INTO item_compra
                    (
                        id_compra,
                        id_variacao_produto,
                        quantidade,
                        preco_unitario,
                        subtotal
                    )
                    VALUES
                    (?, ?, ?, ?, ?)
                    `,
                    [
                        id_compra,
                        id_variacao_produto,
                        quantidadeCompra,
                        precoUnitario,
                        subtotal
                    ]
                );

                // ------------------------------------------
                // DIMINUI ESTOQUE
                // ------------------------------------------

                await connection.query(
                    `
                    UPDATE variacao_produto
                    SET quantidade = quantidade - ?
                    WHERE id_variacao_produto = ?
                    `,
                    [
                        quantidadeCompra,
                        id_variacao_produto
                    ]
                );
            }

            // ==========================================
            // ATUALIZA VALOR TOTAL
            // ==========================================

            await connection.query(
                `
                UPDATE compra
                SET valor_total = ?
                WHERE id_compra = ?
                `,
                [
                    valorTotal,
                    id_compra
                ]
            );

            // ==========================================
            // CONFIRMA TRANSACTION
            // ==========================================

            await connection.commit();

            connection.release();

            return response.status(201).json({
                sucesso: true,
                mensagem: 'Compra criada com sucesso',
                id_compra: id_compra,
                valor_total: valorTotal
            });

        } catch (error: any) {

            // ==========================================
            // DESFAZ TUDO
            // ==========================================

            if (connection) {
                await connection.rollback();
                connection.release();
            }

            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao criar compra',
                erro: error.message
            });
        }
    }


    async alterarEnderecoCompra(request: Request, response: Response) {

        const usuario = (request as any).usuario;

        // ==========================================
        // VERIFICA USUÁRIO DO JWT
        // ==========================================

        if (!usuario || !usuario.id_usuario) {
            return response.status(401).json({
                sucesso: false,
                mensagem: 'Usuário não identificado ou token inválido'
            });
        }

        const id_usuario = usuario.id_usuario;

        // ==========================================
        // PEGA ID DA COMPRA
        // ==========================================

        const { id_compra } = request.params;

        if (
            !id_compra ||
            !Number.isInteger(Number(id_compra)) ||
            Number(id_compra) <= 0
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'ID da compra inválido'
            });
        }

        // ==========================================
        // PEGA DADOS DO ENDEREÇO
        // ==========================================

        const {
            cep,
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            estado
        } = request.body;

        // ==========================================
        // VALIDAÇÕES
        // ==========================================

        if (!cep || typeof cep !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe um CEP válido'
            });
        }

        if (!logradouro || typeof logradouro !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe o logradouro'
            });
        }

        if (!numero || typeof numero !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe o número'
            });
        }

        if (!bairro || typeof bairro !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe o bairro'
            });
        }

        if (!cidade || typeof cidade !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe a cidade'
            });
        }

        if (!estado || typeof estado !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe o estado'
            });
        }

        // ==========================================
        // CONEXÃO
        // ==========================================

        let connection;

        try {

            connection = await poolPromise.getConnection();

            // ==========================================
            // ATUALIZA ENDEREÇO
            // ==========================================

            const [resultado]: any = await connection.query(
                `
            UPDATE compra
            SET
                cep = ?,
                logradouro = ?,
                numero = ?,
                complemento = ?,
                bairro = ?,
                cidade = ?,
                estado = ?
            WHERE id_compra = ?
            AND id_usuario = ?
            AND status IN ('aguardando pagamento', 'em processamento')
            `,
                [
                    cep.trim(),
                    logradouro.trim(),
                    numero.trim(),
                    complemento ? complemento.trim() : null,
                    bairro.trim(),
                    cidade.trim(),
                    estado.trim(),
                    Number(id_compra),
                    id_usuario
                ]
            );

            // ==========================================
            // VERIFICA SE ATUALIZOU
            // ==========================================

            if (resultado.affectedRows === 0) {

                connection.release();

                return response.status(404).json({
                    sucesso: false,
                    mensagem: 'Compra não encontrada ou não pode mais ter o endereço alterado'
                });
            }

            // ==========================================
            // LIBERA CONEXÃO
            // ==========================================

            connection.release();

            // ==========================================
            // RESPOSTA
            // ==========================================

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Endereço da compra atualizado com sucesso',
                id_compra: Number(id_compra)
            });

        } catch (error: any) {

            if (connection) {
                connection.release();
            }

            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao atualizar endereço da compra',
                erro: error.message
            });
        }
    }

    async cancelarCompra(request: Request, response: Response) {

        const usuario = (request as any).usuario;

        // ==========================================
        // VERIFICA USUÁRIO DO JWT
        // ==========================================

        if (!usuario || !usuario.id_usuario) {
            return response.status(401).json({
                sucesso: false,
                mensagem: 'Usuário não identificado ou token inválido'
            });
        }

        const id_usuario = usuario.id_usuario;

        // ==========================================
        // PEGA ID DA COMPRA
        // ==========================================

        const { id_compra } = request.params;

        if (
            !id_compra ||
            !Number.isInteger(Number(id_compra)) ||
            Number(id_compra) <= 0
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'ID da compra inválido'
            });
        }

        let connection;

        try {

            connection = await poolPromise.getConnection();

            // ==========================================
            // INICIA TRANSACTION
            // ==========================================

            await connection.beginTransaction();

            // ==========================================
            // BUSCA OS ITENS DA COMPRA
            // ==========================================

            const [itensCompra]: any = await connection.query(
                `
            SELECT
                ic.id_variacao_produto,
                ic.quantidade
            FROM item_compra ic
            INNER JOIN compra c
                ON c.id_compra = ic.id_compra
            WHERE c.id_compra = ?
            AND c.id_usuario = ?
            `,
                [
                    Number(id_compra),
                    id_usuario
                ]
            );

            // ==========================================
            // VERIFICA SE A COMPRA EXISTE
            // ==========================================

            if (itensCompra.length === 0) {

                await connection.rollback();
                connection.release();

                return response.status(404).json({
                    sucesso: false,
                    mensagem: 'Compra não encontrada'
                });
            }

            // ==========================================
            // DEVOLVE OS ITENS PARA O ESTOQUE
            // ==========================================

            for (const item of itensCompra) {

                await connection.query(
                    `
                UPDATE variacao_produto
                SET quantidade = quantidade + ?
                WHERE id_variacao_produto = ?
                `,
                    [
                        Number(item.quantidade),
                        Number(item.id_variacao_produto)
                    ]
                );
            }

            // ==========================================
            // ALTERA STATUS DA COMPRA
            // ==========================================

            const [resultadoCompra]: any = await connection.query(
                `
            UPDATE compra
            SET status = 'cancelada'
            WHERE id_compra = ?
            AND id_usuario = ?
            `,
                [
                    Number(id_compra),
                    id_usuario
                ]
            );

            // ==========================================
            // VERIFICA SE ATUALIZOU
            // ==========================================

            if (resultadoCompra.affectedRows === 0) {

                throw new Error(
                    'Não foi possível cancelar a compra'
                );
            }

            // ==========================================
            // CONFIRMA TRANSACTION
            // ==========================================

            await connection.commit();

            connection.release();

            // ==========================================
            // RESPOSTA
            // ==========================================

            return response.status(200).json({
                sucesso: true,
                mensagem: 'Compra cancelada com sucesso',
                id_compra: Number(id_compra)
            });

        } catch (error: any) {

            // ==========================================
            // DESFAZ TUDO
            // ==========================================

            if (connection) {

                await connection.rollback();

                connection.release();
            }

            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao cancelar compra',
                erro: error.message
            });
        }
    }
}

export { CompraRepository };