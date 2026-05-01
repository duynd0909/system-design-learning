import { Module } from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { ProblemsController } from './problems.controller';
import { ShareModule } from '../share/share.module';

@Module({
  imports: [ShareModule],
  providers: [ProblemsService],
  controllers: [ProblemsController],
})
export class ProblemsModule {}
