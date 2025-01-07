import {
  ArgumentMetadata,
  Injectable,
  ValidationPipe,
  ValidationPipeOptions,
} from "@nestjs/common";

@Injectable()
export class AbstractValidationPipe extends ValidationPipe {
  constructor(
    options: ValidationPipeOptions,
    // private readonly targetTypes:  { body?: Type; query?: Type; param?: Type } ,
    private readonly targetTypes: any
  ) {
    super(options);
  }

  async transform(value: any, metadata: ArgumentMetadata) {
    const targetType = this.targetTypes[metadata.type];
    if (!targetType) {
      return super.transform(value, metadata);
    }
    return super.transform(value, { ...metadata, metatype: targetType });
  }
}
