import { pool } from '../../../mysql';
import { v4 as uuidv4 } from 'uuid';
import { hash, compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { Request, Response } from 'express';
import nodemailer from 'nodemailer';


// ==================================================
// CONFIGURAÇÃO DO NODEMAILER
// ==================================================

const transporter = nodemailer.createTransport({

    service: 'gmail',

    auth: {

        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASSWORD

    },

    connectionTimeout: 10000,

    greetingTimeout: 10000,

    socketTimeout: 10000

});


// ==================================================
// USER REPOSITORY
// ==================================================

class UserRepository {


    // ==================================================
    // CRIAR USUÁRIO TIPO CLIENTE
    // ==================================================

    createCliente(request: Request, response: Response) {

        const {

            nome,
            email,
            senha,
            acesso,
            foto,
            celular

        } = request.body;


        // ==================================================
        // CONECTAR AO BANCO
        // ==================================================

        pool.getConnection(

            (err: any, connection: any) => {


                // ==========================================
                // ERRO AO CONECTAR NO MYSQL
                // ==========================================

                if (err) {

                    return response.status(500).json({

                        sucesso: false,

                        mensagem:
                            'Erro ao conectar com o banco',

                        erro:
                            err.message

                    });

                }


                // ==========================================
                // CRIPTOGRAFAR SENHA
                // ==========================================

                hash(

                    senha,

                    10,

                    (err, senhaHash) => {


                        // ==================================
                        // ERRO AO CRIPTOGRAFAR
                        // ==================================

                        if (err) {

                            connection.release();

                            return response.status(500).json({

                                sucesso: false,

                                mensagem:
                                    'Erro ao criptografar a senha'

                            });

                        }


                        // ==================================
                        // GERAR ID DO USUÁRIO
                        // ==================================

                        const id_usuario =
                            uuidv4();


                        // ==================================
                        // INSERIR USUÁRIO
                        // ==================================

                        connection.query(

                            `
                            INSERT INTO usuarios
                            (
                                id_usuario,
                                nome,
                                email,
                                senha,
                                acesso,
                                foto,
                                celular
                            )
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                            `,

                            [

                                id_usuario,

                                nome,

                                email,

                                senhaHash,

                                'cliente',

                                foto,

                                celular

                            ],

                            (
                                error: any,
                                result: any
                            ) => {


                                // ==================================
                                // LIBERAR CONEXÃO
                                // ==================================

                                connection.release();


                                // ==================================
                                // E-MAIL JÁ CADASTRADO
                                // ==================================

                                if (

                                    error &&
                                    error.code === 'ER_DUP_ENTRY'

                                ) {

                                    return response.status(409).json({

                                        sucesso: false,

                                        mensagem:
                                            'E-mail já cadastrado'

                                    });

                                }


                                // ==================================
                                // OUTRO ERRO
                                // ==================================

                                if (error) {

                                    return response.status(500).json({

                                        sucesso: false,

                                        mensagem:
                                            'Erro ao cadastrar usuário',

                                        erro:
                                            error.message

                                    });

                                }


                                // ==================================
                                // RESPONDE IMEDIATAMENTE
                                // ==================================

                                response.status(201).json({

                                    sucesso: true,

                                    mensagem:
                                        'Usuário cadastrado com sucesso'

                                });


                                // ==================================
                                // ENVIA E-MAIL EM SEGUNDO PLANO
                                // ==================================

                                transporter.sendMail({

                                    from:
                                        `"Style Shoes" <${process.env.EMAIL_USER}>`,

                                    to:
                                        email,

                                    subject:
                                        'Cadastro realizado | Style Shoes',

                                    html: `

        <div
            style="
                font-family: Arial, Helvetica, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 30px;
                color: #222222;
                background-color: #ffffff;
                line-height: 1.6;
            "
        >

            <h1
                style="
                    margin: 0 0 25px 0;
                    font-size: 28px;
                    color: #111111;
                "
            >
                Style Shoes
            </h1>

            <h2
                style="
                    font-size: 20px;
                    font-weight: normal;
                    color: #222222;
                "
            >
                Olá, ${nome}!
            </h2>

            <p>
                Seu cadastro foi realizado com sucesso na
                plataforma Style Shoes.
            </p>

            <p>
                A partir de agora, você já pode acessar o sistema
                utilizando o e-mail e a senha cadastrados.
            </p>

            <div
                style="
                    margin: 25px 0;
                    padding: 15px;
                    background-color: #f4f4f4;
                    border-left: 4px solid #222222;
                "
            >
                <strong>
                    Cadastro confirmado
                </strong>
            </div>

            <p
                style="
                    font-size: 13px;
                    color: #666666;
                "
            >
                Este sistema faz parte de um projeto acadêmico.
            </p>

            <hr
                style="
                    margin: 30px 0;
                    border: 0;
                    border-top: 1px solid #dddddd;
                "
            >

            <p
                style="
                    margin: 0;
                    font-size: 12px;
                    color: #888888;
                "
            >
                Este é um e-mail automático enviado pela plataforma
                Style Shoes. Não é necessário respondê-lo.
            </p>

        </div>

    `

                                })

                                    .then(() => {

                                        console.log(
                                            'E-mail de confirmação enviado para:',
                                            email
                                        );

                                    })

                                    .catch((erroEmail) => {

                                        console.error(
                                            'Erro ao enviar e-mail:',
                                            erroEmail
                                        );

                                    });

                            }

                        );

                    }

                );

            }

        );

    }


    // ==================================================
    // CRIAR USUÁRIO TIPO ADMIN
    // ==================================================

    createAdmin(request: Request, response: Response) {

        const {

            nome,
            email,
            senha,
            acesso,
            foto,
            celular

        } = request.body;


        // ==================================================
        // CONECTAR AO BANCO
        // ==================================================

        pool.getConnection(

            (err: any, connection: any) => {


                // ==========================================
                // ERRO AO CONECTAR
                // ==========================================

                if (err) {

                    return response.status(500).json({

                        sucesso: false,

                        mensagem:
                            'Erro ao conectar com o banco',

                        erro:
                            err.message

                    });

                }


                // ==========================================
                // CRIPTOGRAFAR SENHA
                // ==========================================

                hash(

                    senha,

                    10,

                    (err, senhaHash) => {


                        // ==================================
                        // ERRO AO CRIPTOGRAFAR
                        // ==================================

                        if (err) {

                            connection.release();

                            return response.status(500).json({

                                sucesso: false,

                                mensagem:
                                    'Erro ao criptografar a senha'

                            });

                        }


                        // ==================================
                        // GERAR ID
                        // ==================================

                        const id_usuario =
                            uuidv4();


                        // ==================================
                        // INSERIR ADMIN
                        // ==================================

                        connection.query(

                            `
                            INSERT INTO usuarios
                            (
                                id_usuario,
                                nome,
                                email,
                                senha,
                                acesso,
                                foto,
                                celular
                            )
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                            `,

                            [

                                id_usuario,

                                nome,

                                email,

                                senhaHash,

                                'admin',

                                foto,

                                celular

                            ],

                            (
                                error: any,
                                result: any
                            ) => {


                                // ==================================
                                // LIBERAR CONEXÃO
                                // ==================================

                                connection.release();


                                // ==================================
                                // E-MAIL JÁ CADASTRADO
                                // ==================================

                                if (

                                    error &&
                                    error.code === 'ER_DUP_ENTRY'

                                ) {

                                    return response.status(409).json({

                                        sucesso: false,

                                        mensagem:
                                            'E-mail já cadastrado'

                                    });

                                }


                                // ==================================
                                // OUTRO ERRO
                                // ==================================

                                if (error) {

                                    return response.status(500).json({

                                        sucesso: false,

                                        mensagem:
                                            'Erro ao cadastrar usuário',

                                        erro:
                                            error.message

                                    });

                                }


                                // ==================================
                                // RESPONDE IMEDIATAMENTE
                                // ==================================

                                response.status(201).json({

                                    sucesso: true,

                                    mensagem:
                                        'Usuário cadastrado com sucesso'

                                });


                                // ==================================
                                // ENVIA E-MAIL EM SEGUNDO PLANO
                                // ==================================

                                transporter.sendMail({
                                    from: `"Style Shoes" <${process.env.EMAIL_USER}>`,

                                    to: email,

                                    subject: "Cadastro de administrador - Style Shoes",

                                    html: `

        <div
            style="
                font-family: Arial, Helvetica, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 30px;
                color: #222222;
                background-color: #ffffff;
                line-height: 1.6;
            "
        >

            <h1
                style="
                    margin: 0 0 25px 0;
                    font-size: 28px;
                    color: #111111;
                "
            >
                Style Shoes
            </h1>

            <h2
                style="
                    font-size: 20px;
                    font-weight: normal;
                    color: #222222;
                "
            >
                Olá, ${nome}!
            </h2>

            <p>
                Seu cadastro foi realizado com sucesso na
                plataforma Style Shoes.
            </p>

            <p>
                A partir de agora, você já pode acessar o sistema
                utilizando o e-mail e a senha cadastrados.
            </p>

            <div
                style="
                    margin: 25px 0;
                    padding: 15px;
                    background-color: #f4f4f4;
                    border-left: 4px solid #222222;
                "
            >
                <strong>
                    Cadastro confirmado
                </strong>
            </div>

            <p
                style="
                    font-size: 13px;
                    color: #666666;
                "
            >
                Este sistema faz parte de um projeto acadêmico.
            </p>

            <hr
                style="
                    margin: 30px 0;
                    border: 0;
                    border-top: 1px solid #dddddd;
                "
            >

            <p
                style="
                    margin: 0;
                    font-size: 12px;
                    color: #888888;
                "
            >
                Este é um e-mail automático enviado pela plataforma
                Style Shoes. Não é necessário respondê-lo.
            </p>

        </div>

    `
                                })

                                    .then(() => {

                                        console.log(
                                            'E-mail de administrador enviado para:',
                                            email
                                        );

                                    })

                                    .catch((erroEmail) => {

                                        console.error(
                                            'Erro ao enviar e-mail:',
                                            erroEmail
                                        );

                                    });

                            }

                        );

                    }

                );

            }

        );

    }


    // ==================================================
    // LOGIN
    // ==================================================

    login(request: Request, response: Response) {

        const {

            email,
            senha

        } = request.body;


        pool.getConnection(

            (err: any, connection: any) => {


                // ==========================================
                // ERRO AO CONECTAR
                // ==========================================

                if (err) {

                    return response.status(500).json({

                        sucesso: false,

                        mensagem:
                            'Erro ao conectar com o banco',

                        erro:
                            err.message

                    });

                }


                // ==========================================
                // BUSCAR USUÁRIO
                // ==========================================

                connection.query(

                    'SELECT * FROM usuarios WHERE email = ?',

                    [email],

                    (
                        error: any,
                        result: any
                    ) => {


                        connection.release();


                        // ==================================
                        // ERRO NA CONSULTA
                        // ==================================

                        if (error) {

                            return response.status(400).json({

                                sucesso: false,

                                mensagem:
                                    'Erro ao consultar usuário',

                                erro:
                                    error.message

                            });

                        }


                        // ==================================
                        // USUÁRIO NÃO ENCONTRADO
                        // ==================================

                        if (
                            result.length === 0
                        ) {

                            return response.status(404).json({

                                sucesso: false,

                                mensagem:
                                    'Usuário não cadastrado'

                            });

                        }


                        const usuario =
                            result[0];


                        // ==================================
                        // COMPARAR SENHA
                        // ==================================

                        compare(

                            senha,

                            usuario.senha,

                            (
                                err,
                                senhaCorreta
                            ) => {


                                // ==============================
                                // ERRO AO VERIFICAR SENHA
                                // ==============================

                                if (err) {

                                    return response.status(500).json({

                                        sucesso: false,

                                        mensagem:
                                            'Erro ao verificar a senha'

                                    });

                                }


                                // ==============================
                                // SENHA INCORRETA
                                // ==============================

                                if (!senhaCorreta) {

                                    return response.status(401).json({

                                        sucesso: false,

                                        mensagem:
                                            'Senha incorreta'

                                    });

                                }


                                // ==============================
                                // GERAR JWT
                                // ==============================

                                const token = sign(

                                    {

                                        id_usuario:
                                            usuario.id_usuario,

                                        email:
                                            usuario.email,

                                        acesso:
                                            usuario.acesso

                                    },

                                    process.env.SECRET as string,

                                    {

                                        expiresIn:
                                            '1d'

                                    }

                                );


                                // ==============================
                                // RETORNO
                                // ==============================

                                return response.status(200).json({

                                    sucesso: true,

                                    mensagem:
                                        'Login realizado com sucesso',

                                    token,

                                    usuario: {

                                        id_usuario:
                                            usuario.id_usuario,

                                        nome:
                                            usuario.nome,

                                        email:
                                            usuario.email,

                                        acesso:
                                            usuario.acesso,

                                        foto:
                                            usuario.foto,

                                        celular:
                                            usuario.celular

                                    }

                                });

                            }

                        );

                    }

                );

            }

        );

    }


    // ==================================================
    // BUSCAR PERFIL
    // ==================================================

    getPerfil(request: Request, response: Response) {

        const id_usuario =
            (request as any).usuario.id_usuario;


        pool.getConnection(

            (err: any, connection: any) => {


                // ==========================================
                // ERRO AO CONECTAR
                // ==========================================

                if (err) {

                    return response.status(500).json({

                        sucesso: false,

                        mensagem:
                            'Erro ao conectar ao banco',

                        erro:
                            err.message

                    });

                }


                // ==========================================
                // BUSCAR PERFIL
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

                        ON e.id_usuario =
                           u.id_usuario

                    WHERE u.id_usuario = ?

                    `,

                    [id_usuario],

                    (
                        error: any,
                        result: any[]
                    ) => {


                        connection.release();


                        // ==================================
                        // ERRO NA CONSULTA
                        // ==================================

                        if (error) {

                            return response.status(500).json({

                                sucesso: false,

                                mensagem:
                                    'Erro ao buscar perfil do usuário',

                                erro:
                                    error.message

                            });

                        }


                        // ==================================
                        // USUÁRIO NÃO ENCONTRADO
                        // ==================================

                        if (
                            result.length === 0
                        ) {

                            return response.status(404).json({

                                sucesso: false,

                                mensagem:
                                    'Usuário não encontrado'

                            });

                        }


                        // ==================================
                        // MONTA USUÁRIO
                        // ==================================

                        const usuario = {

                            id_usuario:
                                result[0].id_usuario,

                            nome:
                                result[0].nome,

                            email:
                                result[0].email,

                            acesso:
                                result[0].acesso,

                            foto:
                                result[0].foto,

                            celular:
                                result[0].celular,

                            endereco: {

                                id_endereco:
                                    result[0].id_endereco,

                                cep:
                                    result[0].cep,

                                estado:
                                    result[0].estado,

                                rua:
                                    result[0].rua,

                                numero:
                                    result[0].numero,

                                complemento:
                                    result[0].complemento,

                                bairro:
                                    result[0].bairro,

                                cidade:
                                    result[0].cidade

                            }

                        };


                        // ==================================
                        // RESPOSTA
                        // ==================================

                        return response.status(200).json({

                            sucesso: true,

                            mensagem:
                                'Perfil encontrado com sucesso',

                            usuario:
                                usuario

                        });

                    }

                );

            }

        );

    }

}

export { UserRepository };