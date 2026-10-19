import { Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Prisma } from '../src/generated/prisma/client';
import { TaskPriority, TaskStatus } from '../src/generated/prisma/enums';
import { AppConfigModule } from '../src/lib/config/app-config.module';
import { PrismaModule } from '../src/lib/database/prisma.module';
import { PrismaService } from '../src/lib/database/prisma.service';

// Only the infrastructure the seed needs: env config + Prisma.
@Module({ imports: [AppConfigModule, PrismaModule] })
class SeedModule {}

type SeedTask = Omit<Prisma.TaskCreateManyInput, 'orderIndex'>;

const tasks: SeedTask[] = [
  // BACKLOG
  {
    title: 'Definir criterios de aceptación del tablero',
    description: 'Reunir requisitos con el equipo de producto y documentarlos.',
    status: TaskStatus.BACKLOG,
    priority: TaskPriority.HIGH,
  },
  {
    title: 'Diseñar vista móvil del Kanban',
    description: 'Wireframes para pantallas menores a 768px.',
    status: TaskStatus.BACKLOG,
    priority: TaskPriority.MEDIUM,
  },
  {
    title: 'Agregar filtros por prioridad en el frontend',
    status: TaskStatus.BACKLOG,
    priority: TaskPriority.LOW,
  },
  {
    title: 'Evaluar autenticación de usuarios',
    description: 'Decidir si las tareas tendrán propietario.',
    status: TaskStatus.BACKLOG,
    priority: TaskPriority.MEDIUM,
  },
  {
    title: 'Configurar pipeline de CI',
    description: 'Build, lint y tests en cada pull request.',
    status: TaskStatus.BACKLOG,
    priority: TaskPriority.HIGH,
  },
  {
    title: 'Documentar API con Swagger',
    status: TaskStatus.BACKLOG,
    priority: TaskPriority.LOW,
  },
  // IN_PROGRESS
  {
    title: 'Implementar drag & drop entre columnas',
    description: 'Consumir PATCH /api/tasks/:id/move desde el frontend.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.URGENT,
  },
  {
    title: 'Crear formulario de nueva tarea',
    description: 'Validar título entre 3 y 255 caracteres.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
  },
  {
    title: 'Escribir tests unitarios del algoritmo de move',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
  },
  {
    title: 'Manejo global de errores HTTP en el cliente',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
  },
  {
    title: 'Ajustar estilos del encabezado',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.LOW,
  },
  // REVIEW
  {
    title: 'Endpoint de actualización de tareas',
    description: 'PATCH /api/tasks/:id con título, descripción y prioridad.',
    status: TaskStatus.REVIEW,
    priority: TaskPriority.HIGH,
  },
  {
    title: 'Índices de base de datos para status y prioridad',
    status: TaskStatus.REVIEW,
    priority: TaskPriority.MEDIUM,
  },
  {
    title: 'Revisar mensajes de validación de DTOs',
    status: TaskStatus.REVIEW,
    priority: TaskPriority.LOW,
  },
  {
    title: 'Corregir conflicto de transacciones concurrentes',
    description: 'Mapear el error P2034 de Prisma a 409 Conflict.',
    status: TaskStatus.REVIEW,
    priority: TaskPriority.URGENT,
  },
  // DONE
  {
    title: 'Configurar proyecto NestJS',
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
  },
  {
    title: 'Integrar Prisma con PostgreSQL',
    description: 'PrismaModule global con adapter pg.',
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
  },
  {
    title: 'Eliminar Better Auth del proyecto',
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
  },
  {
    title: 'Crear migración de la tabla tasks',
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
  },
  {
    title: 'Endpoint para listar tareas',
    description: 'GET /api/tasks con filtro opcional por prioridad.',
    status: TaskStatus.DONE,
    priority: TaskPriority.LOW,
  },
];

function withOrderIndex(items: SeedTask[]): Prisma.TaskCreateManyInput[] {
  const nextIndex = new Map<TaskStatus, number>();
  return items.map((task) => {
    const status = task.status ?? TaskStatus.BACKLOG;
    const orderIndex = nextIndex.get(status) ?? 0;
    nextIndex.set(status, orderIndex + 1);
    return { ...task, status, orderIndex };
  });
}

async function seed() {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const prisma = app.get(PrismaService);
    // Remote DB: the first connection can exceed the default 2s maxWait.
    const { count } = await prisma.$transaction(
      async (tx) => {
        await tx.task.deleteMany();
        return tx.task.createMany({ data: withOrderIndex(tasks) });
      },
      { maxWait: 15_000, timeout: 30_000 },
    );
    logger.log(`Inserted ${count} tasks`);
  } finally {
    await app.close();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
