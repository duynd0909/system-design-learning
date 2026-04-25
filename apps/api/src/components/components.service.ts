import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComponentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.componentType.findMany({ orderBy: { label: 'asc' } });
  }
}
