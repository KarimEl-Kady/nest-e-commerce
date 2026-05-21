import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    category: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const dto = { name: 'Electronics', description: 'Tech' };
      mockPrismaService.category.findUnique.mockResolvedValue(null);
      mockPrismaService.category.create.mockResolvedValue({ id: '1', ...dto });

      const result = await service.create(dto);

      expect(prisma.category.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual({ id: '1', ...dto });
    });

    it('should throw ConflictException if name exists', async () => {
      const dto = { name: 'Electronics' };
      mockPrismaService.category.findUnique.mockResolvedValue({ id: '1', name: 'Electronics' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return categories with product counts', async () => {
      const categories = [{ id: '1', name: 'Electronics', _count: { products: 5 } }];
      mockPrismaService.category.findMany.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(prisma.category.findMany).toHaveBeenCalledWith(expect.objectContaining({
        include: { _count: expect.any(Object) },
      }));
      expect(result).toEqual(categories);
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      const category = { id: '1', name: 'Electronics' };
      mockPrismaService.category.findUnique.mockResolvedValue(category);
      mockPrismaService.category.delete.mockResolvedValue(category);

      const result = await service.remove('1');

      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual({ message: 'Category deleted successfully' });
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });
});
