import express from 'express';
import { userRoutes } from './routes/user.routes';
import { productRoutes } from './routes/produtos.routes';
import { marcasRoutes } from './routes/marcas.routes';
import { variacaoRoutes } from './routes/variacao.routes';
import { fotosRoutes } from './routes/fotos.routes';
import { corRoutes } from './routes/cor.routes';
import { compraRoutes } from './routes/compra.routes';
import { enderecoRoutes } from './routes/usuario.endereco.routes';
import { relatorioRoutes } from './routes/relatorio.routes';
import { config } from 'dotenv';
import cors from "cors";

console.log("1 - servidor.ts iniciou");

config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/usuario', userRoutes);
app.use('/produto', productRoutes);
app.use('/marca', marcasRoutes);
app.use('/produto', variacaoRoutes);
app.use('/produto', fotosRoutes);
app.use('/produto', corRoutes);
app.use('/compra', compraRoutes);
app.use('/usuario', enderecoRoutes);
app.use('/relatorio', relatorioRoutes);

console.log("2 - chegou antes do app.listen")

app.listen(4000, () => {
    console.log('Servidor rodando na porta 4000');
});