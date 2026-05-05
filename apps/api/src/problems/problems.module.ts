import { Module } from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { ProblemsController } from './problems.controller';
import { ShareModule } from '../share/share.module';
import { ComponentsModule } from '../components/components.module';

@Module({
  imports: [ShareModule, ComponentsModule],
  providers: [ProblemsService],
  controllers: [ProblemsController],
})
export class ProblemsModule {}
