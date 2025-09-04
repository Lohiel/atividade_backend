const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /cursos
router.get('/', async (req, res) => {
  const cursos = await prisma.curso.findMany();
  res.json(cursos);
});

// GET /cursos/:id
router.get('/:id', async (req, res) => {
  const curso = await prisma.curso.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!curso) return res.status(404).json({ error: 'Não encontrado' });
  res.json(curso);
});

// POST /cursos
router.post('/', async (req, res) => {
  try {
    console.log('Body recebido:', req.body);
    // Validate nome
    if (!req.body || !req.body.nome || typeof req.body.nome !== 'string' || req.body.nome.trim() === '') {
      return res.status(400).json({ error: 'Campo "nome" é obrigatório e deve ser uma string não vazia' });
    }
    // Validate idiomaId
    if (!req.body.idiomaId || isNaN(parseInt(req.body.idiomaId))) {
      return res.status(400).json({ error: 'Campo "idiomaId" é obrigatório e deve ser um número válido' });
    }
    // Validate cargaHoraria
    if (!req.body.cargaHoraria || isNaN(parseInt(req.body.cargaHoraria)) || parseInt(req.body.cargaHoraria) <= 0) {
      return res.status(400).json({ error: 'Campo "cargaHoraria" é obrigatório e deve ser um número inteiro positivo' });
    }
    const idiomaId = parseInt(req.body.idiomaId);
    const cargaHoraria = parseInt(req.body.cargaHoraria);
    // Check if idioma exists
    const idioma = await prisma.idioma.findUnique({ where: { id: idiomaId } });
    if (!idioma) {
      return res.status(400).json({ error: `Idioma com id ${idiomaId} não encontrado` });
    }
    // Create curso
    const curso = await prisma.curso.create({ 
      data: { 
        nome: req.body.nome, 
        idiomaId: idiomaId,
        cargaHoraria: cargaHoraria
      } 
    });
    res.status(201).json(curso);
  } catch (error) {
    console.error('Erro ao criar curso:', error);
    if (error.code === 'P2003') {
      return res.status(400).json({ error: `Idioma com id ${req.body.idiomaId} não existe` });
    }
    res.status(500).json({ error: 'Erro interno ao criar curso: ' + error.message });
  }
});

// PUT /cursos/:id
router.put('/:id', async (req, res) => {
  const curso = await prisma.curso.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!curso) return res.status(404).json({ error: 'Não encontrado' });
  const updated = await prisma.curso.update({ 
    where: { id: parseInt(req.params.id) }, 
    data: { 
      nome: req.body.nome, 
      idiomaId: parseInt(req.body.idiomaId) 
    } 
  });
  res.json(updated);
});

// DELETE /cursos/:id
router.delete('/:id', async (req, res) => {
  const curso = await prisma.curso.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!curso) return res.status(404).json({ error: 'Não encontrado' });
  await prisma.curso.delete({ where: { id: parseInt(req.params.id) } });
  res.status(204).send();
});

router.get('/:id/retencao', async (req, res) => {
  const { id } = req.params;
  const { janela = 90 } = req.query;

  const totalAlunos = await prisma.matricula.count({
    where: { cursoId: parseInt(id) },
    distinct: ['alunoId'],
  });
  if (totalAlunos === 0) return res.json({ retencao: 0 });

  const retidos = await prisma.matricula.count({
    where: {
      cursoId: parseInt(id),
      aluno: {
        matriculas: {
          some: {
            dataInicio: {
              gte: new Date(new Date().setDate(new Date().getDate() - janela)),
            },
            OR: [{ dataFim: null }, { dataFim: { gt: new Date() } }],
          },
        },
      },
    },
    distinct: ['alunoId'],
  });

  res.json({ retencao: (retidos / totalAlunos) * 100 });
});

router.get('/populares', async (req, res) => {
  const { top = 5, de, ate } = req.query;
  const where = {};
  if (de) where.dataInicio = { gte: new Date(de) };
  if (ate) where.dataInicio = { ...where.dataInicio, lte: new Date(ate) };

  const populares = await prisma.matricula.groupBy({
    by: ['cursoId'],
    where,
    _count: { cursoId: true },
    orderBy: { _count: { cursoId: 'desc' } },
    take: parseInt(top),
  });

  const result = await Promise.all(populares.map(async p => ({
    curso: await prisma.curso.findUnique({ where: { id: p.cursoId } }),
    matriculas: p._count.cursoId,
  })));

  res.json(result);
});

module.exports = router;