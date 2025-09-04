const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /matriculas
router.get('/', async (req, res) => {
  const matriculas = await prisma.matricula.findMany();
  res.json(matriculas);
});

// GET /matriculas/:id
router.get('/:id', async (req, res) => {
  const matricula = await prisma.matricula.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!matricula) return res.status(404).json({ error: 'Não encontrado' });
  res.json(matricula);
});

// POST /matriculas
router.post('/', async (req, res) => {
  try {
    const { alunoId, cursoId } = req.body;
    const existe = await prisma.matricula.findFirst({ where: { alunoId, cursoId } });
    if (existe) return res.status(409).json({ error: 'Matrícula já existe' });
    const matricula = await prisma.matricula.create({ 
      data: { 
        alunoId: parseInt(alunoId), 
        cursoId: parseInt(cursoId), 
        dataInicio: new Date(req.body.dataInicio),
        dataFim: req.body.dataFim ? new Date(req.body.dataFim) : null 
      } 
    });
    res.status(201).json(matricula);
  } catch (error) {
    res.status(400).json({ error: 'Dados inválidos' });
  }
});

// PUT /matriculas/:id
router.put('/:id', async (req, res) => {
  const matricula = await prisma.matricula.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!matricula) return res.status(404).json({ error: 'Não encontrado' });
  const updated = await prisma.matricula.update({ 
    where: { id: parseInt(req.params.id) }, 
    data: { 
      alunoId: parseInt(req.body.alunoId), 
      cursoId: parseInt(req.body.cursoId), 
      dataInicio: new Date(req.body.dataInicio),
      dataFim: req.body.dataFim ? new Date(req.body.dataFim) : null 
    } 
  });
  res.json(updated);
});

// DELETE /matriculas/:id
router.delete('/:id', async (req, res) => {
  const matricula = await prisma.matricula.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!matricula) return res.status(404).json({ error: 'Não encontrado' });
  await prisma.matricula.delete({ where: { id: parseInt(req.params.id) } });
  res.status(204).send();
});

router.get('/novas', async (req, res) => {
  const { de, ate, cursor, limit = 10 } = req.query;
  const where = {};
  if (de) where.dataInicio = { gte: new Date(de) };
  if (ate) where.dataInicio = { ...where.dataInicio, lte: new Date(ate) };
  if (cursor) where.id = { lt: parseInt(cursor) };

  const matriculas = await prisma.matricula.findMany({
    where,
    orderBy: [{ dataInicio: 'desc' }, { id: 'desc' }],
    take: parseInt(limit),
    include: { aluno: true, curso: true },
  });

  const nextCursor = matriculas.length === limit ? matriculas[matriculas.length - 1].id : null;
  res.json({ matriculas, nextCursor });
});

router.get('/dup-check', async (req, res) => {
  const { alunoId, cursoId } = req.query;
  const existe = await prisma.matricula.findFirst({
    where: { alunoId: parseInt(alunoId), cursoId: parseInt(cursoId) },
  });
  res.status(existe ? 409 : 200).json({ message: existe ? 'Duplicada' : 'OK' });
});

module.exports = router;