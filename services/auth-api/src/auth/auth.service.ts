import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity, RefreshTokenEntity } from '@itadx/database';
import { ErrorCodes, BusinessException } from '@itadx/common';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity) private tokenRepo: Repository<RefreshTokenEntity>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException(ErrorCodes.INVALID_CREDENTIALS);
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException(ErrorCodes.INVALID_CREDENTIALS);
    }

    // WHY: 마지막 로그인 시각을 기록하여 감사 및 보안 모니터링에 활용
    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    const payload = { sub: user.id, email: user.email, role: user.role, martId: user.martId };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Refresh Token을 해시하여 DB에 저장
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await this.tokenRepo.save({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: Record<string, unknown>;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new BusinessException(ErrorCodes.REFRESH_TOKEN_EXPIRED, '리프레시 토큰이 만료되었습니다.', 401);
    }

    const tokens = await this.tokenRepo.find({ where: { userId: payload.sub as string } });
    const valid = await this.findValidToken(tokens, refreshToken);
    if (!valid) {
      throw new BusinessException(ErrorCodes.REFRESH_TOKEN_REVOKED, '리프레시 토큰이 무효화되었습니다.', 401);
    }

    const newPayload = { sub: payload.sub, email: payload.email, role: payload.role, martId: payload.martId };
    return { accessToken: this.jwtService.sign(newPayload) };
  }

  async logout(userId: string): Promise<void> {
    await this.tokenRepo.delete({ userId });
  }

  async getProfile(userId: string): Promise<Omit<UserEntity, 'passwordHash'>> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    const { passwordHash, ...profile } = user;
    return profile as Omit<UserEntity, 'passwordHash'>;
  }

  private async findValidToken(
    tokens: RefreshTokenEntity[],
    rawToken: string,
  ): Promise<RefreshTokenEntity | null> {
    for (const t of tokens) {
      if (await bcrypt.compare(rawToken, t.tokenHash)) return t;
    }
    return null;
  }
}
