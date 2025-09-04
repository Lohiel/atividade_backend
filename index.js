const express = require('express');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Rotas
app.use('/alunos', require('./routes/alunos'));
app.use('/cursos', require('./routes/cursos'));
app.use('/idiomas', require('./routes/idiomas'));
app.use('/matriculas', require('./routes/matriculas'));
app.use('/saude', require('./routes/saude'));

app.listen(3000, () => {console.log('Servidor rodando na porta: 3000')});