import { Injectable, Type } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ApiProperty } from '@nestjs/swagger';

export function Mixin(
  mixinClass: Type<any>,
  value: string = randomStringGenerator(),
) {
  Object.defineProperty(mixinClass, 'name', { value: value });
  Injectable()(mixinClass);
  return mixinClass;
}

function createResponseType<T>(clazz: Type<T>, isArray = false) {
  class A {
    @ApiProperty()
    status: string;
  }

  if (isArray) {
    class ResultSet extends A {
      @ApiProperty({ type: clazz, isArray: true })
      resultset: any;
    }
    return Mixin(ResultSet, `ResponseSetOf${clazz.name}`);
  }

  class Result extends A {
    @ApiProperty({ type: clazz })
    result: any;
  }
  return Mixin(Result, `ResponseOf${clazz.name}`);
}

export const SwaggerResponseType = <T>(
  clazz: Type<T>,
  isArray = false,
): Type<any> => createResponseType(clazz, isArray);
