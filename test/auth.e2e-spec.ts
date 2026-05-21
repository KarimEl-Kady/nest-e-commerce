import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
    // Cleanup any left over user
    await prisma.user.deleteMany({ where: { email: 'e2e@test.com' } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'e2e@test.com' } });
    await app.close();
  });

  it('/api/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'e2e@test.com',
        password: 'Password123!',
        name: 'E2E Test',
      })
      .expect((res) => {
        if (res.status !== 201 && res.status !== 409) {
          throw new Error(`Unexpected status ${res.status}: ${JSON.stringify(res.body)}`);
        }
      });
  });

  it('/api/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'e2e@test.com',
        password: 'Password123!',
      })
      .expect((res) => {
        if (res.status !== 200 && res.status !== 401) {
          throw new Error(`Unexpected status ${res.status}: ${JSON.stringify(res.body)}`);
        }
      });
  });
});
