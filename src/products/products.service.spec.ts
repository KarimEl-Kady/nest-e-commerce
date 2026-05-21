import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const dto = { name: 'Test Product', price: 10, stock: 5, sku: 'TEST-SKU' };
      const userId = 'user-1';

      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue({ id: '1', ...dto });

      const result = await service.create(dto, userId);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { sku: 'TEST-SKU' } });
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: { ...dto, createdById: userId },
        include: { category: true },
      });
      expect(result).toEqual({ id: '1', ...dto });
    });

    it('should throw ConflictException if SKU exists', async () => {
      const dto = { name: 'Test Product', price: 10, stock: 5, sku: 'TEST-SKU' };
      const userId = 'user-1';

      mockPrismaService.product.findUnique.mockResolvedValue({ id: '2', sku: 'TEST-SKU' });

      await expect(service.create(dto, userId)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a product', async () => {
      const product = { id: '1', name: 'Test', published: true, deletedAt: null };
      mockPrismaService.product.findFirst.mockResolvedValue(product);

      const result = await service.findOne('1');

      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: '1', published: true, deletedAt: null },
        include: { category: true },
      });
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a product', async () => {
      const product = { id: '1', name: 'Test', deletedAt: null };
      mockPrismaService.product.findFirst.mockResolvedValue(product);
      mockPrismaService.product.update.mockResolvedValue({ ...product, deletedAt: new Date() });

      const result = await service.remove('1');

      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: '1', deletedAt: null },
      });
      expect(prisma.product.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: '1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) })
      }));
      expect(result).toEqual({ message: 'Product deleted successfully' });
    });
  });
});
