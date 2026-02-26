import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UserEntity, RefreshTokenEntity } from '@itadx/database';

describe('AuthService', () => {
  let service: AuthService;
  const mockUserRepo = { findOne: jest.fn(), update: jest.fn() };
  const mockRefreshRepo = { findOne: jest.fn(), save: jest.fn(), delete: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('mock-jwt') } },
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
        { provide: getRepositoryToken(RefreshTokenEntity), useValue: mockRefreshRepo },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw on invalid credentials', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);
    await expect(service.login('bad@test.com', 'wrong')).rejects.toThrow();
  });
});
