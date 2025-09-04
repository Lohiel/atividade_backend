const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /alunos
router.get('/', async (req, res) => {
  const alunos = await prisma.aluno.findMany();
  res.json(alunos);
});

// GET /alunos/:id
router.get('/:id', async (req, res) => {
  const aluno = await prisma.aluno.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!aluno) return res.status(404).json({ error: 'Não encontrado' });
  res.json(aluno);
});

// POST /alunos
router.post('/', async (req, res) => {
  try {
    const aluno = await prisma.aluno.create({ data: req.body });
    res.status(201).json(aluno);
  } catch (error) {
    res.status(400).json({ error: 'Dados inválidos' });
  }
});

// PUT /alunos/:id
router.put('/:id', async (req, res) => {
  const aluno = await prisma.aluno.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!aluno) return res.status(404).json({ error: 'Não encontrado' });
  const updated = await prisma.aluno.update({ where: { id: parseInt(req.params.id) }, data: req.body });
  res.json(updated);
});

// DELETE /alunos/:id
router.delete('/:id', async (req, res) => {
  const aluno = await prisma.aluno.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!aluno) return res.status(404).json({ error: 'Não encontrado' });
  await prisma.aluno.delete({ where: { id: parseInt(req.params.id) } });
  res.status(204).send();
});

router.get('/sem-matricula', async (req, res) => {
  const { dias = 30 } = req.query;
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - dias);

  const alunos = await prisma.aluno.findMany({
    where: {
      OR: [
        { matriculas: { none: {} } },
        { matriculas: { every: { dataInicio: { lt: dataLimite } } } },
      ],
    },
  });
  res.json(alunos);
});

router.get('/:id/sugestoes-cursos', async (req, res) => {
  const { id } = req.params;
  const aluno = await prisma.aluno.findUnique({
    where: { id: parseInt(id) },
    include: { matriculas: true },
  });
  if (!aluno) return res.status(404).json({ error: 'Não encontrado' });

  const cursosFeitos = aluno.matriculas.map(m => m.cursoId);
  const where = { id: { notIn: cursosFeitos.length ? cursosFeitos : [0] } };
  if (aluno.idiomasInteresse?.length) where.idiomaId = { in: aluno.idiomasInteresse };

  const sugestoes = await prisma.curso.findMany({ where });
  res.json(sugestoes);
});

module.exports = router;