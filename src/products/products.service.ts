import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, userId: string) {
    if (createProductDto.sku) {
      const existing = await this.prisma.product.findUnique({
        where: { sku: createProductDto.sku },
      });
      if (existing) {
        throw new ConflictException('SKU already in use');
      }
    }

    return this.prisma.product.create({
      data: {
        ...createProductDto,
        images: createProductDto.images || [],
        createdById: userId,
      },
      include: { category: true },
    });
  }

  async findAll(query: ProductQueryDto) {
    if (query.search) {
      return this.search(query);
    }

    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', categoryId, minPrice, maxPrice, inStock } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      published: true,
      deletedAt: null,
    };

    if (categoryId) where.categoryId = categoryId;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }
    if (inStock) {
      where.stock = { gt: 0 };
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async search(query: ProductQueryDto) {
    const { page = 1, limit = 20, search, categoryId, minPrice, maxPrice, inStock } = query;
    const skip = (page - 1) * limit;

    // Prisma $queryRaw for full text search
    // Using parameterized inputs carefully
    const conditions = [`"published" = true`, `"deletedAt" IS NULL`, `"search_vector" @@ websearch_to_tsquery('english', $1)`];
    const params: any[] = [search];
    
    let paramIdx = 2;

    if (categoryId) {
      conditions.push(`"categoryId" = $${paramIdx++}`);
      params.push(categoryId);
    }
    if (minPrice !== undefined) {
      conditions.push(`"price" >= $${paramIdx++}`);
      params.push(minPrice);
    }
    if (maxPrice !== undefined) {
      conditions.push(`"price" <= $${paramIdx++}`);
      params.push(maxPrice);
    }
    if (inStock) {
      conditions.push(`"stock" > 0`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const dataQuery = `
      SELECT p.*,
        json_build_object('id', c.id, 'name', c.name) as category,
        ts_rank("search_vector", websearch_to_tsquery('english', $1)) as rank
      FROM "products" p
      LEFT JOIN "categories" c ON p."categoryId" = c.id
      ${whereClause}
      ORDER BY rank DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;
    params.push(limit, skip);

    const countQuery = `
      SELECT count(*)::int
      FROM "products" p
      ${whereClause}
    `;

    // Note: To pass dynamic params to $queryRawUnsafe
    const [data, countResult] = (await Promise.all([
      this.prisma.$queryRawUnsafe(dataQuery, ...params),
      this.prisma.$queryRawUnsafe(countQuery, ...params.slice(0, params.length - 2))
    ])) as [any[], any[]];

    return {
      data,
      total: countResult[0].count,
      page,
      limit
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        published: true,
        deletedAt: null,
      },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existing = await this.prisma.product.findUnique({
        where: { sku: updateProductDto.sku },
      });
      if (existing) {
        throw new ConflictException('SKU already in use');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: { category: true },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Product deleted successfully' };
  }
}
