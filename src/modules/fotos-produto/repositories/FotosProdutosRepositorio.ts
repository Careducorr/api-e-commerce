import { pool } from '../../../mysql';
import { Request, Response } from 'express';
import cloudinary from '../../../cloudinary';

class FotosProdutoRepository {

    cadastroFoto(request: Request, response: Response) {

        const { id_produto, id_cor } = request.body;

        // Verifica se uma imagem foi enviada
        if (!request.file) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Envie uma imagem'
            });
        }

        // Validação do id_produto
        if (
            id_produto === undefined ||
            !Number.isInteger(Number(id_produto))
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_produto não é válido'
            });
        }

        // Validação do id_cor
        if (
            id_cor === undefined ||
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
                    mensagem: 'Erro ao conectar ao banco',
                    erro: error.message
                });
            }

            // Busca as ordens já utilizadas
            connection.query(
                `SELECT ordem
             FROM fotos_produto
             WHERE id_produto = ?
             AND id_cor = ?
             ORDER BY ordem ASC`,
                [id_produto, id_cor],

                async (error: any, result: any[]) => {

                    if (error) {
                        connection.release();

                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao verificar ordem das fotos',
                            erro: error.message
                        });
                    }

                    // Pega somente as ordens existentes
                    const ordensUsadas = result.map(
                        (foto: any) => Number(foto.ordem)
                    );

                    // Procura a primeira ordem disponível
                    let ordem = 1;

                    while (ordensUsadas.includes(ordem)) {
                        ordem++;
                    }

                    // Limite máximo de 5 fotos
                    if (ordem > 5) {
                        connection.release();

                        return response.status(400).json({
                            sucesso: false,
                            mensagem: 'Essa cor já possui 5 fotos'
                        });
                    }

                    try {

                        // Envia a imagem para o Cloudinary
                        const uploadResult =
                            await new Promise<any>((resolve, reject) => {

                                const uploadStream =
                                    cloudinary.uploader.upload_stream(
                                        {
                                            folder: 'e-commerce/produtos'
                                        },
                                        (error, result) => {

                                            if (error) {
                                                reject(error);
                                            } else {
                                                resolve(result);
                                            }

                                        }
                                    );

                                uploadStream.end(request.file!.buffer);

                            });

                        const url = uploadResult.secure_url;

                        // Salva a URL no banco
                        connection.query(
                            `INSERT INTO fotos_produto
                        (url, ordem, id_produto, id_cor)
                        VALUES (?, ?, ?, ?)`,
                            [
                                url,
                                ordem,
                                Number(id_produto),
                                Number(id_cor)
                            ],

                            (error: any, result: any) => {

                                connection.release();

                                if (error) {
                                    return response.status(500).json({
                                        sucesso: false,
                                        mensagem: 'Erro ao cadastrar foto',
                                        erro: error.message
                                    });
                                }

                                return response.status(201).json({
                                    sucesso: true,
                                    mensagem: 'Foto cadastrada com sucesso',
                                    id_foto: result.insertId,
                                    ordem: ordem,
                                    url: url
                                });

                            }
                        );

                    } catch (error: any) {

                        connection.release();

                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao enviar imagem para o Cloudinary',
                            erro: error.message
                        });

                    }

                }
            );
        });
    }

    // substituir uma foto
    editarFoto(request: Request, response: Response) {

        const { id_foto } = request.params;
        const arquivo = request.file;

        // Validação do id_foto
        if (
            id_foto === undefined ||
            id_foto === null ||
            !Number.isInteger(Number(id_foto))
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_foto não é válido'
            });
        }

        // Validação do arquivo
        if (!arquivo) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'Envie uma nova foto'
            });
        }

        pool.getConnection((error, connection) => {

            if (error) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar ao banco',
                    erro: error.message
                });
            }

            // =====================================================
            // BUSCAR FOTO ANTIGA
            // =====================================================

            connection.query(
                `
            SELECT url
            FROM fotos_produto
            WHERE id_foto = ?
            `,
                [Number(id_foto)],

                async (error: any, result: any[]) => {

                    if (error) {
                        connection.release();

                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao buscar foto antiga',
                            erro: error.message
                        });
                    }

                    if (result.length === 0) {
                        connection.release();

                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Foto não encontrada'
                        });
                    }

                    const urlAntiga = result[0].url;

                    try {

                        // =====================================================
                        // UPLOAD DA NOVA FOTO NO CLOUDINARY
                        // =====================================================

                        const uploadResult = await cloudinary.uploader.upload(
                            `data:${arquivo.mimetype};base64,${arquivo.buffer.toString('base64')}`,
                            {
                                folder: 'e-commerce/produtos'
                            }
                        );

                        const novaUrl = uploadResult.secure_url;

                        // =====================================================
                        // ATUALIZAR URL NO BANCO
                        // =====================================================

                        connection.query(
                            `
                        UPDATE fotos_produto
                        SET url = ?
                        WHERE id_foto = ?
                        `,
                            [
                                novaUrl,
                                Number(id_foto)
                            ],

                            async (error: any, result: any) => {

                                if (error) {

                                    connection.release();

                                    // =================================================
                                    // CASO O BANCO FALHE, APAGA A NOVA FOTO
                                    // PARA NÃO DEIXAR LIXO NO CLOUDINARY
                                    // =================================================

                                    try {
                                        await cloudinary.uploader.destroy(
                                            uploadResult.public_id
                                        );
                                    } catch (erroCloudinary) {
                                        console.log(
                                            'Erro ao excluir nova foto do Cloudinary:',
                                            erroCloudinary
                                        );
                                    }

                                    return response.status(500).json({
                                        sucesso: false,
                                        mensagem: 'Erro ao atualizar foto no banco',
                                        erro: error.message
                                    });
                                }

                                if (result.affectedRows === 0) {

                                    connection.release();

                                    return response.status(404).json({
                                        sucesso: false,
                                        mensagem: 'Foto não encontrada'
                                    });
                                }

                                connection.release();

                                // =====================================================
                                // APAGAR FOTO ANTIGA DO CLOUDINARY
                                // =====================================================

                                try {

                                    // Remove a parte da URL até /upload/
                                    const caminho = urlAntiga.split('/upload/')[1];

                                    if (caminho) {

                                        // Remove versão v123456/
                                        const partes = caminho.split('/');

                                        if (partes[0].startsWith('v')) {
                                            partes.shift();
                                        }

                                        // Remove extensão .jpg, .png, etc.
                                        const publicId = partes
                                            .join('/')
                                            .replace(/\.[^/.]+$/, '');

                                        await cloudinary.uploader.destroy(publicId);
                                    }

                                } catch (erroCloudinary) {

                                    console.log(
                                        'Erro ao excluir foto antiga do Cloudinary:',
                                        erroCloudinary
                                    );

                                }

                                // =====================================================
                                // RESPOSTA
                                // =====================================================

                                return response.status(200).json({
                                    sucesso: true,
                                    mensagem: 'Foto substituída com sucesso',
                                    id_foto: Number(id_foto),
                                    url: novaUrl
                                });

                            }
                        );

                    } catch (erro: any) {

                        connection.release();

                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao enviar nova foto para o Cloudinary',
                            erro: erro.message
                        });

                    }

                }
            );
        });
    }

    //ver a foto
    getFotos(request: Request, response: Response) {

        const { id_produto, id_cor } = request.query;

        if (
            !id_produto ||
            !Number.isInteger(Number(id_produto))
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_produto não é válido'
            });
        }

        if (
            !id_cor ||
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
                    mensagem: 'Erro ao conectar ao banco',
                    erro: error.message
                });
            }

            connection.query(
                `SELECT *
             FROM fotos_produto
             WHERE id_produto = ?
             AND id_cor = ?
             ORDER BY ordem ASC`,
                [id_produto, id_cor],

                (error: any, result: any[]) => {

                    connection.release();

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao buscar fotos',
                            erro: error.message
                        });
                    }

                    if (result.length === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Nenhuma foto encontrada'
                        });
                    }

                    return response.status(200).json({
                        sucesso: true,
                        mensagem: 'Fotos encontradas',
                        fotos: result
                    });
                }
            );
        });
    }

    //deletar foto
    deletarFoto(request: Request, response: Response) {

        const { id_foto } = request.params;

        if (
            !id_foto ||
            !Number.isInteger(Number(id_foto))
        ) {
            return response.status(400).json({
                sucesso: false,
                mensagem: 'O id_foto não é válido'
            });
        }

        pool.getConnection((error, connection) => {

            if (error) {
                return response.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao conectar ao banco',
                    erro: error.message
                });
            }

            connection.query(
                `DELETE FROM fotos_produto
             WHERE id_foto = ?`,
                [id_foto],

                (error: any, result: any) => {

                    connection.release();

                    if (error) {
                        return response.status(500).json({
                            sucesso: false,
                            mensagem: 'Erro ao excluir foto',
                            erro: error.message
                        });
                    }

                    if (result.affectedRows === 0) {
                        return response.status(404).json({
                            sucesso: false,
                            mensagem: 'Foto não encontrada'
                        });
                    }

                    return response.status(200).json({
                        sucesso: true,
                        mensagem: 'Foto excluída com sucesso'
                    });
                }
            );
        });
    }

}

export { FotosProdutoRepository };