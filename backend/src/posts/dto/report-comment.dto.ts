import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ReportReason } from '../enums/report-reason.enum';

export class ReportCommentDto {
  @ApiProperty({
    enum: ReportReason,
    example: ReportReason.HARASSMENT,
    description: 'Reason the comment is being reported',
  })
  @IsEnum(ReportReason)
  reason: ReportReason;
}
