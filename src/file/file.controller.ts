import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Put,
  Query,
  Res,
  InternalServerErrorException
} from '@nestjs/common';
import {
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { W_OK } from 'constants';
import * as fs from 'fs';
import * as path from 'path';
import { Stream } from 'stream';
import { FileService } from './file.service';
import { FastifyReply } from 'fastify';
import {
  SWAGGER_DESC_DELETE_FILE,
  SWAGGER_DESC_READ_FILE,
  SWAGGER_DESC_READ_FILE_ON_SERVER,
  SWAGGER_DESC_SAVE_RAW_CONTENT
} from './file.controller.swagger.desc';
import { CloudProvidersMetaData } from './cloud.providers.metadata';

@Controller('/api/file')
@ApiTags('Files controller')
export class FileController {
  private readonly logger = new Logger(FileController.name);

  constructor(private fileService: FileService) {}

  private getContentType(contentType: string) {
    if (contentType) {
      return contentType;
    } else {
      return 'application/octet-stream';
    }
  }

  private async loadCPFile(cpBaseUrl: string, filePath: string) {
    if (!filePath.startsWith(cpBaseUrl)) {
      throw new BadRequestException(`Invalid parameter 'path' ${filePath}`);
    }

    const file: Stream = await this.fileService.getFile(filePath);

    return file;
  }

  private isValidPath(filePath: string): boolean {
    // Implement a basic whitelist check
    const allowedPaths = ['config/products/crystals/'];
    return allowedPaths.some(allowedPath => filePath.startsWith(allowedPath));
  }

  private isValidUrl(url: string): boolean {
    // Implement a basic whitelist check for URLs
    const allowedHosts = ['example.com']; // Add allowed hosts here
    try {
      const { hostname } = new URL(url);
      return allowedHosts.includes(hostname);
    } catch (error) {
      return false;
    }
  }

  @Get('/azure')
  @ApiQuery({
    name: 'path',
    example: 'http://example.com/resource',
    required: true
  })
  @ApiQuery({ name: 'type', example: 'image/jpg', required: true })
  @ApiHeader({ name: 'accept', example: 'image/jpg', required: true })
  @ApiOkResponse({
    description: 'File read successfully'
  })
  @ApiInternalServerErrorResponse({
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        location: { type: 'string' }
      }
    }
  })
  @ApiOperation({
    description: SWAGGER_DESC_READ_FILE
  })
  async loadAzureFile(
    @Query('path') path: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    try {
      if (!this.isValidUrl(path)) {
        throw new BadRequestException('Invalid URL');
      }

      const file: Stream = await this.loadCPFile(
        CloudProvidersMetaData.AZURE,
        path
      );
      const type = this.getContentType(contentType);
      res.type(type);

      return file;
    } catch (error) {
      this.logger.error('Error loading Azure file', error.stack);
      throw new InternalServerErrorException('An error occurred while processing your request.');
    }
  }

  @Get('/aws')
  @ApiQuery({
    name: 'path',
    example: 'config/products/crystals/amethyst.jpg',
    required: true
  })
  @ApiQuery({ name: 'type', example: 'image/jpg', required: true })
  @ApiHeader({ name: 'accept', example: 'image/jpg', required: true })
  @ApiOkResponse({
    description: 'File read successfully'
  })
  @ApiInternalServerErrorResponse({
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        location: { type: 'string' }
      }
    }
  })
  @ApiOperation({
    description: SWAGGER_DESC_READ_FILE
  })
  async loadAwsFile(
    @Query('path') path: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    try {
      if (!this.isValidPath(path)) {
        throw new BadRequestException('Invalid path');
      }

      const sanitizedPath = path.replace(/[^a-zA-Z0-9/._-]/g, ''); // Sanitize path to allow only specific characters
      const file: Stream = await this.loadCPFile(
        CloudProvidersMetaData.AWS,
        sanitizedPath
      );
      const type = this.getContentType(contentType);
      res.type(type);

      return file;
    } catch (error) {
      this.logger.error('Error loading AWS file', error.stack);
      throw new InternalServerErrorException('An error occurred while processing your request.');
    }
  }

  @Get('/digital_ocean')
  @ApiQuery({
    name: 'path',
    example: 'http://example.com/resource',
    required: true
  })
  @ApiQuery({ name: 'type', example: 'image/jpg', required: true })
  @ApiHeader({ name: 'accept', example: 'image/jpg', required: true })
  @ApiOkResponse({
    description: 'File read successfully'
  })
  @ApiInternalServerErrorResponse({
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        location: { type: 'string' }
      }
    }
  })
  @ApiOperation({
    description: SWAGGER_DESC_READ_FILE
  })
  async loadDigitalOceanFile(
    @Query('path') path: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    try {
      if (!this.isValidUrl(path)) {
        throw new BadRequestException('Invalid URL');
      }

      const file: Stream = await this.loadCPFile(
        CloudProvidersMetaData.DIGITAL_OCEAN,
        path
      );
      const type = this.getContentType(contentType);
      res.type(type);

      return file;
    } catch (error) {
      this.logger.error('Error loading Digital Ocean file', error.stack);
      throw new InternalServerErrorException('An error occurred while processing your request.');
    }
  }

  // Other methods remain unchanged
}
