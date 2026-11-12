import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { alive: boolean } {
    return {alive: true};
  }
}
