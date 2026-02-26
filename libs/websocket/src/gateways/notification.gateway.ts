import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket): void {
    const token = client.handshake.auth?.token;
    // WHY: JWT를 검증하여 역할 기반 Room에 배정
    // 실제 구현에서는 JwtService로 토큰 파싱
    if (token) {
      // TODO: JWT 파싱 후 역할별 Room join
      // client.join(`bank`); 또는 client.join(`mart:${martId}`);
    }
  }

  handleDisconnect(_client: Socket): void {
    // 클라이언트 연결 해제 시 처리
  }

  /** 은행 사용자에게 알림 발송 */
  notifyBank(event: string, data: unknown): void {
    this.server.to('bank').emit(event, data);
  }

  /** 특정 마트에 알림 발송 */
  notifyMart(martId: string, event: string, data: unknown): void {
    this.server.to(`mart:${martId}`).emit(event, data);
  }

  /** 관리자에게 알림 발송 */
  notifyAdmin(event: string, data: unknown): void {
    this.server.to('admin').emit(event, data);
  }
}
