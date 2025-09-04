const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /idiomas
router.get('/', async (req, res) => {
  const idiomas = await prisma.idioma.findMany();
  res.json(idiomas);
});

// GET /idiomas/:id
router.get('/:id', async (req, res) => {
  const idioma = await prisma.idioma.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!idioma) return res.status(404).json({ error: 'Não encontrado' });
  res.json(idioma);
});

// POST /idiomas
router.post('/', async (req, res) => {
  try {
    const idioma = await prisma.idioma.create({ 
      data: { nome: req.body.nome } 
    });
    res.status(201).json(idioma);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /idiomas/:id
router.put('/:id', async (req, res) => {
  const idioma = await prisma.idioma.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!idioma) return res.status(404).json({ error: 'Não encontrado' });
  const updated = await prisma.idioma.update({ 
    where: { id: parseInt(req.params.id) }, 
    data: { nome: req.body.nome } 
  });
  res.json(updated);
});

// DELETE /idiomas/:id
router.delete('/:id', async (req, res) => {
  const idioma = await prisma.idioma.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!idioma) return res.status(404).json({ error: 'Não encontrado' });
  await prisma.idioma.delete({ where: { id: parseInt(req.params.id) } });
  res.status(204).send();
});

router.get('/distribuicao', async (req, res) => {
  const idiomas = await prisma.idioma.findMany({
    include: { cursos: { include: { matriculas: { select: { alunoId: true } } } } },
  });

  const result = idiomas.map(idioma => ({
    idioma: idioma.nome,
    totalAlunos: [...new Set(idioma.cursos.flatMap(c => c.matriculas.map(m => m.alunoId)))].length,
  }));

  res.json(result);
});

module.exports = router;