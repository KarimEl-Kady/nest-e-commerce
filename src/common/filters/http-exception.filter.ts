import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';
    let errorType = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
      errorType = exception.name;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002' || exception.code === 'P2003') {
        status = HttpStatus.CONFLICT;
        message = 'Database conflict: A unique constraint or foreign key constraint failed.';
        errorType = 'ConflictException';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Record to update not found.';
        errorType = 'NotFoundException';
      }
    }

    const errorResponse =
      typeof message === 'string'
        ? { statusCode: status, message, error: errorType }
        : { statusCode: status, ...((message as any) || {}), error: errorType };

    response.status(status).json(errorResponse);
  }
}
