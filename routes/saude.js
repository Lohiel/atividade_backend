const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/consistencia', async (req, res) => {
  const orfaosAluno = await prisma.matricula.findMany({
    where: { aluno: { is: null } },
  });
  const orfaosCurso = await prisma.matricula.findMany({
    where: { curso: { is: null } },
  });
  res.json({ orfaosAluno, orfaosCurso });
});

module.exports = router;