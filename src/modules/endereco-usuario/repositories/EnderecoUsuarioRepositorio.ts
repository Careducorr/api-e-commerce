import { poolPromise } from '../../../mysql';
import { Request, Response } from 'express';

class EnderecoUsuarioRepository {

    async cadastrarEndereco(request: Request, response: Response) {

        // ==========================================
        // VERIFICA USUÁRIO DO JWT
        // ==========================================

        const usuario = (request as any).usuario;

        if (!usuario || !usuario.id_usuario) {
            return response.status(401).json({
                sucesso: false,
                mensagem: 'Usuário não identificado ou token inválido'
            });
        }

        const id_usuario = usuario.id_usuario;

        // ==========================================
        // PEGA DADOS DO BODY
        // ==========================================

        const {
            cep,
            estado,
            rua,
            numero,
            complemento,
            bairro,
            cidade
        } = request.body;

        // ==========================================
        // VALIDAÇÕES
        // ==========================================

        if (!cep || typeof cep !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe o CEP'
            });
        }

        if (!estado || typeof estado !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe o estado'
            });
        }

        if (!rua || typeof rua !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe a rua'
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

        // ==========================================
        // CONEXÃO COM BANCO
        // ==========================================

        let connection;

        try {

            connection = await poolPromise.getConnection();

            // ==========================================
            // CADASTRA ENDEREÇO
            // ==========================================

            const [resultado]: any = await connection.query(
                `
            INSERT INTO endereco
            (
                cep,
                estado,
                rua,
                numero,
                complemento,
                bairro,
                cidade,
                id_usuario
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?)
            `,
                [
                    cep.trim(),
                    estado.trim(),
                    rua.trim(),
                    numero.trim(),
                    complemento ? complemento.trim() : null,
                    bairro.trim(),
                    cidade.trim(),
                    id_usuario
                ]
            );

            connection.release();

            // ==========================================
            // RESPOSTA
            // ==========================================

            return response.status(201).json({
                sucesso: true,
                mensagem: 'Endereço cadastrado com sucesso',
                id_endereco: resultado.insertId
            });

        } catch (error: any) {

            if (connection) {
                connection.release();
            }

            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao cadastrar endereço',
                erro: error.message
            });
        }
    }

    async alterarEndereco(request: Request, response: Response) {

        // ==========================================
        // VERIFICA USUÁRIO DO JWT
        // ==========================================

        const usuario = (request as any).usuario;

        if (!usuario || !usuario.id_usuario) {
            return response.status(401).json({
                sucesso: false,
                mensagem: 'Usuário não identificado ou token inválido'
            });
        }

        const id_usuario = usuario.id_usuario;

        // ==========================================
        // PEGA DADOS DO BODY
        // ==========================================

        const {
            cep,
            estado,
            rua,
            numero,
            complemento,
            bairro,
            cidade
        } = request.body;

        // ==========================================
        // VALIDAÇÕES
        // ==========================================

        if (!cep || typeof cep !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe o CEP'
            });
        }

        if (!estado || typeof estado !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe o estado'
            });
        }

        if (!rua || typeof rua !== 'string') {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Informe a rua'
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
            UPDATE endereco
            SET
                cep = ?,
                estado = ?,
                rua = ?,
                numero = ?,
                complemento = ?,
                bairro = ?,
                cidade = ?
            WHERE id_usuario = ?
            `,
                [
                    cep.trim(),
                    estado.trim(),
                    rua.trim(),
                    numero.trim(),
                    complemento ? complemento.trim() : null,
                    bairro.trim(),
                    cidade.trim(),
                    id_usuario
                ]
            );

            // ==========================================
            // VERIFICA SE O ENDEREÇO EXISTE
            // ==========================================

            if (resultado.affectedRows === 0) {

                connection.release();

                return response.status(404).json({
                    sucesso: false,
                    mensagem: 'Endereço não encontrado para este usuário'
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
                mensagem: 'Endereço atualizado com sucesso'
            });

        } catch (error: any) {

            if (connection) {
                connection.release();
            }

            return response.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao atualizar endereço',
                erro: error.message
            });
        }
    }

}

export { EnderecoUsuarioRepository };