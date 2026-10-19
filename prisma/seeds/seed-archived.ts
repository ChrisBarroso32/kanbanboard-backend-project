import { randomUUID } from 'node:crypto';
import { Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Prisma } from '../../src/generated/prisma/client';
import { AppConfigModule } from '../../src/lib/config/app-config.module';
import { PrismaModule } from '../../src/lib/database/prisma.module';
import { PrismaService } from '../../src/lib/database/prisma.service';

// Only the infrastructure the seed needs: env config + Prisma.
@Module({ imports: [AppConfigModule, PrismaModule] })
class SeedArchivedModule {}

type SeedArchivedTask = Pick<
  Prisma.ArchivedTaskCreateManyInput,
  'title' | 'description'
> & { createdDaysAgo: number; archivedDaysAgo: number };

// Tareas DONE ya archivadas. Los días son relativos a hoy para que el
// listado (archivedAt desc) y el export tengan fechas variadas.
const archivedTasks: SeedArchivedTask[] = [
  {
    title: 'Definir modelo de datos de tareas',
    description: 'Tabla tasks con status, prioridad y order_index.',
    createdDaysAgo: 60,
    archivedDaysAgo: 45,
  },
  {
    title: 'Configurar ESLint y Prettier',
    createdDaysAgo: 58,
    archivedDaysAgo: 45,
  },
  {
    title: 'Crear endpoint POST /api/tasks',
    description: 'Validación de DTO con class-validator.',
    createdDaysAgo: 55,
    archivedDaysAgo: 40,
  },
  {
    title: 'Crear endpoint DELETE /api/tasks/:id',
    description: 'Reordena las tareas restantes de la columna.',
    createdDaysAgo: 50,
    archivedDaysAgo: 35,
  },
  {
    title: 'Implementar algoritmo de move entre columnas',
    description: 'Transacción con reordenamiento de order_index.',
    createdDaysAgo: 48,
    archivedDaysAgo: 30,
  },
  {
    title: 'Agregar @nestjs/config',
    description: 'Validación de variables de entorno al arrancar.',
    createdDaysAgo: 40,
    archivedDaysAgo: 25,
  },
  {
    title: 'Habilitar CORS para el frontend',
    createdDaysAgo: 38,
    archivedDaysAgo: 21,
  },
  {
    title: 'Configurar maxWait y timeout en transacciones',
    description: 'TX_OPTIONS compartido por el repositorio.',
    createdDaysAgo: 30,
    archivedDaysAgo: 14,
  },
  {
    title: 'Publicar documentación en Swagger UI',
    createdDaysAgo: 25,
    archivedDaysAgo: 7,
  },
  {
    title: 'Exportar tareas archivadas a Excel',
    description: 'GET /api/tasks/archived/export con exceljs.',
    createdDaysAgo: 10,
    archivedDaysAgo: 1,
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function toRows(
  items: SeedArchivedTask[],
): Prisma.ArchivedTaskCreateManyInput[] {
  const now = Date.now();
  return items.map(({ createdDaysAgo, archivedDaysAgo, ...task }) => ({
    ...task,
    id: randomUUID(),
    createdAt: new Date(now - createdDaysAgo * DAY_MS),
    updatedAt: new Date(now - archivedDaysAgo * DAY_MS),
    archivedAt: new Date(now - archivedDaysAgo * DAY_MS),
  }));
}

async function seed() {
  const logger = new Logger('SeedArchived');
  const app = await NestFactory.createApplicationContext(SeedArchivedModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const prisma = app.get(PrismaService);
    // Solo toca archived_tasks; la tabla tasks no se modifica.
    // Remote DB: the first connection can exceed the default 2s maxWait.
    const { count } = await prisma.$transaction(
      async (tx) => {
        await tx.archivedTask.deleteMany();
        return tx.archivedTask.createMany({ data: toRows(archivedTasks) });
      },
      { maxWait: 15_000, timeout: 30_000 },
    );
    logger.log(`Inserted ${count} archived tasks`);
  } finally {
    await app.close();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
