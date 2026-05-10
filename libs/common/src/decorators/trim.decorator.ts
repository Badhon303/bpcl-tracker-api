import { isString } from '@nestjs/common/utils/shared.utils';
import { Transform } from 'class-transformer';

export const Trim = () =>
  Transform(({ value }) => {
    isString(value) && (value = value.trim());
    return value;
  });
