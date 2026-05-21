import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let adminToken: string;
  let categoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    adminToken = jwtService.sign({ sub: 'admin-2', role: 'ADMIN' }, { secret: process.env.JWT_SECRET || 'test_secret' });
  });

  afterAll(async () => {
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await app.close();
  });

  it('/categories (POST) - create category', async () => {
    const res = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'E2E Category', description: 'Testing' })
      .expect(201);

    categoryId = res.body.id;
    expect(res.body.name).toBe('E2E Category');
  });

  it('/categories (GET) - list categories', () => {
    return request(app.getHttpServer())
      .get('/categories')
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.some(c => c.id === categoryId)).toBe(true);
      });
  });

  it('/categories/:id (PATCH) - update category', async () => {
    await request(app.getHttpServer())
      .patch(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'E2E Category Updated' })
      .expect(200);

    const list = await request(app.getHttpServer()).get('/categories');
    const updated = list.body.find(c => c.id === categoryId);
    expect(updated.name).toBe('E2E Category Updated');
  });

  it('/categories/:id (DELETE) - delete category', async () => {
    await request(app.getHttpServer())
      .delete(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const list = await request(app.getHttpServer()).get('/categories');
    expect(list.body.some(c => c.id === categoryId)).toBe(false);
  });
});
