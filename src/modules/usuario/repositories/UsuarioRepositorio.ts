import { pool } from '../../../mysql';
import { v4 as uuidv4 } from 'uuid';
import { hash, compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { Request, Response } from 'express';


class UserRepository {

    //criando usuário tipo clinete
    createCliente(request: Request, response: Response) {
        const { nome, email, senha, acesso, foto, celular } = request.body;

        pool.getConnection((err: any, connection: any) => {

            // Erro ao conectar no MySQL
            if (err) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar com o banco',
                    erro: err.message
                });
            }

            // Criptografa a senha
            hash(senha, 10, (err, senhaHash) => {

                if (err) {
                    connection.release();

                    return response.status(500).json({
                        sucesso: false,
                        mensagem: 'Erro ao criptografar a senha'
                    });
                }

                // Insere o usuário
                connection.query(
                    'INSERT INTO usuarios (id_usuario, nome, email, senha, acesso, foto, celular) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                        uuidv4(),
                        nome,
                        email,
                        senhaHash,
                        'cliente',
                        foto,
                        celular
                    ],
                    (error: any, result: any) => {

                        connection.release();

                        if (error) {
                            return response.status(500).json({
                                sucesso: false,
                                mensagem: 'Erro ao cadastrar usuário',
                                erro: error.message
                            });
                        }

                        response.status(201).json({
                            sucesso: true,
                            mensagem: 'Usuário cadastrado com sucesso'
                        });
                    }
                );
            });
        });
    }

    createAdmin(request: Request, response: Response) {
        const { nome, email, senha, acesso, foto, celular } = request.body;

        pool.getConnection((err: any, connection: any) => {

            // Erro ao conectar no MySQL
            if (err) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar com o banco',
                    erro: err.message
                });
            }

            // Criptografa a senha
            hash(senha, 10, (err, senhaHash) => {

                if (err) {
                    connection.release();

                    return response.status(500).json({
                        sucesso: false,
                        mensagem: 'Erro ao criptografar a senha'
                    });
                }

                // Insere o usuário
                connection.query(
                    'INSERT INTO usuarios (id_usuario, nome, email, senha, acesso, foto, celular) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                        uuidv4(),
                        nome,
                        email,
                        senhaHash,
                        acesso,
                        foto,
                        celular
                    ],
                    (error: any, result: any) => {

                        connection.release();

                        if (error) {
                            return response.status(500).json({
                                sucesso: false,
                                mensagem: 'Erro ao cadastrar usuário',
                                erro: error.message
                            });
                        }

                        response.status(201).json({
                            sucesso: true,
                            mensagem: 'Usuário cadastrado com sucesso'
                        });
                    }
                );
            });
        });
    }

    login(request: Request, response: Response) {
        const { email, senha, acesso } = request.body;

        pool.getConnection((err: any, connection: any) => {

            // Erro ao conectar no MySQL
            if (err) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar com o banco',
                    erro: err.message
                });
            }

            connection.query(
                'SELECT * FROM usuarios WHERE email = ?',
                [email],
                (error: any, result: any) => {

                    connection.release();

                    if (error) {
                        return response.status(400).json({
                            sucesso: false,
                            mensagem: 'Erro ao consultar usuário',
                            erro: error.message
                        });
                    }

                    if (result.length === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Usuário não cadastrado'
                        });
                    }

                    const usuario = result[0];

                    compare(senha, usuario.senha, (err, senhaCorreta) => {

                        if (err) {
                            return response.status(500).json({
                                sucesso: false,
                                mensagem: 'Erro ao verificar a senha'
                            });
                        }

                        if (!senhaCorreta) {
                            return response.status(401).json({
                                sucesso: false,
                                mensagem: 'Senha incorreta'
                            });
                        }

                        const token = sign(
                            {
                                id_usuario: usuario.id_usuario,
                                email: usuario.email,
                                acesso: usuario.acesso
                            },
                            process.env.SECRET as string,
                            { expiresIn: "1d" }
                        );

                        return response.status(200).json({
                            sucesso: true,
                            mensagem: 'Login realizado com sucesso',
                            token
                        });
                    });
                }
            );
        });
    }

    getPerfil(request: Request, response: Response) {

        // ==========================================
        // ID DO USUÁRIO VINDO DO JWT
        // ==========================================

        const id_usuario = (request as any).usuario.id_usuario;

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
            // BUSCA PERFIL DO USUÁRIO
            // ==========================================

            connection.query(
                `
            SELECT
                u.id_usuario,
                u.nome,
                u.email,
                u.acesso,
                u.foto,
                u.celular,

                e.id_endereco,
                e.cep,
                e.estado,
                e.rua,
                e.numero,
                e.complemento,
                e.bairro,
                e.cidade

            FROM usuarios u

            LEFT JOIN endereco e
                ON e.id_usuario = u.id_usuario

            WHERE u.id_usuario = ?
            `,
                [id_usuario],

                (error: any, result: any[]) => {

                    connection.release();

                    // ==========================================
                    // ERRO NA CONSULTA
                    // ==========================================

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao buscar perfil do usuário',
                            erro: error.message
                        });
                    }

                    // ==========================================
                    // USUÁRIO NÃO ENCONTRADO
                    // ==========================================

                    if (result.length === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Usuário não encontrado'
                        });
                    }

                    // ==========================================
                    // MONTA PERFIL
                    // ==========================================

                    const usuario = {
                        id_usuario: result[0].id_usuario,
                        nome: result[0].nome,
                        email: result[0].email,
                        acesso: result[0].acesso,
                        foto: result[0].foto,
                        celular: result[0].celular,

                        endereco: {
                            id_endereco: result[0].id_endereco,
                            cep: result[0].cep,
                            estado: result[0].estado,
                            rua: result[0].rua,
                            numero: result[0].numero,
                            complemento: result[0].complemento,
                            bairro: result[0].bairro,
                            cidade: result[0].cidade
                        }
                    };

                    // ==========================================
                    // RESPOSTA
                    // ==========================================

                    return response.status(200).json({
                        sucesso: true,
                        mensagem: 'Perfil encontrado com sucesso',
                        usuario: usuario
                    });
                }
            );
        });
    }

}

export { UserRepository };