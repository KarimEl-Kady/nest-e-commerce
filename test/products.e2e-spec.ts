import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let adminToken: string;
  let customerToken: string;
  let categoryId: string;
  let productId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Create a category
    const category = await prisma.category.create({
      data: { name: 'E2E Test Category', description: 'Test' },
    });
    categoryId = category.id;

    // Generate tokens directly for e2e
    adminToken = jwtService.sign({ sub: 'admin-1', role: 'ADMIN' }, { secret: process.env.JWT_SECRET || 'test_secret' });
    customerToken = jwtService.sign({ sub: 'cust-1', role: 'CUSTOMER' }, { secret: process.env.JWT_SECRET || 'test_secret' });
  });

  afterAll(async () => {
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await app.close();
  });

  it('/products (POST) - as customer should fail', () => {
    return request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Test Product', price: 99.99, stock: 10 })
      .expect(403);
  });

  it('/products (POST) - as admin should succeed', async () => {
    const res = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Product', price: 99.99, stock: 10, categoryId })
      .expect(201);

    productId = res.body.id;
    expect(res.body.name).toBe('Test Product');
    expect(res.body.categoryId).toBe(categoryId);
  });

  it('/products (GET) - listing', () => {
    return request(app.getHttpServer())
      .get('/products')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.total).toBeGreaterThanOrEqual(1);
      });
  });

  it('/products/:id (GET) - detail', () => {
    return request(app.getHttpServer())
      .get(`/products/${productId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(productId);
        expect(res.body.name).toBe('Test Product');
      });
  });

  it('/products/:id (PATCH) - update', async () => {
    await request(app.getHttpServer())
      .patch(`/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 79.99 })
      .expect(200);

    const check = await request(app.getHttpServer()).get(`/products/${productId}`);
    expect(check.body.price).toBe('79.99'); // Decimal may come back as string
  });

  it('/products/:id (DELETE) - soft delete', async () => {
    await request(app.getHttpServer())
      .delete(`/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Should not be visible anymore
    await request(app.getHttpServer())
      .get(`/products/${productId}`)
      .expect(404);
  });
});
