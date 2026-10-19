import { Injectable, StreamableFile } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { withPrismaErrors } from '../../../common/prisma-errors';
import { ArchivedTask } from '../../../generated/prisma/client';
import { TaskArchiveRepository } from '../repositories/task-archive.repository';

const XLSX_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const DATE_FORMAT = 'yyyy-mm-dd hh:mm';

@Injectable()
export class TaskArchiveService {
  constructor(private readonly archiveRepository: TaskArchiveRepository) {}

  findAll(): Promise<ArchivedTask[]> {
    return this.archiveRepository.findMany();
  }

  async archive(): Promise<{ archived: number }> {
    const archived = await withPrismaErrors(
      this.archiveRepository.archiveDone(),
    );
    return { archived };
  }

  async exportXlsx(): Promise<StreamableFile> {
    const tasks = await this.archiveRepository.findMany();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Tareas archivadas', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    sheet.columns = [
      { header: 'Título', key: 'title', width: 40 },
      {
        header: 'Descripción',
        key: 'description',
        width: 60,
        style: { alignment: { wrapText: true, vertical: 'top' } },
      },
      {
        header: 'Creada',
        key: 'createdAt',
        width: 18,
        style: { numFmt: DATE_FORMAT },
      },
      {
        header: 'Actualizada',
        key: 'updatedAt',
        width: 18,
        style: { numFmt: DATE_FORMAT },
      },
      {
        header: 'Archivada',
        key: 'archivedAt',
        width: 18,
        style: { numFmt: DATE_FORMAT },
      },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.autoFilter = { from: 'A1', to: 'E1' };

    // Plain values (never `{ formula }`): Excel keeps a text cell starting with
    // "=" as text, so no formula injection.
    for (const task of tasks) sheet.addRow(task);

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer), {
      type: XLSX_TYPE,
      disposition: 'attachment; filename="archived-tasks.xlsx"',
    });
  }
}
