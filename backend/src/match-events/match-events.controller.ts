import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

@Controller('match-events')
export class MatchEventsController {
  private supabase: any;

  constructor() {
    const fs = require('fs');
    const path = require('path');

    let supabaseUrl = process.env.SUPABASE_URL || '';
    let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      const envPath = path.resolve(process.cwd(), '../frontend/.env.local');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
        const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
        if (urlMatch && !supabaseUrl) supabaseUrl = urlMatch[1].trim();
        if (keyMatch && !supabaseKey) supabaseKey = keyMatch[1].trim();
      }
    }

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        realtime: {
          transport: ws as any,
        },
      });
    }
  }

  @Post()
  async createMatchEvent(
    @Body('matchId') matchId: string,
    @Body('teamId') teamId: string,
    @Body('playerId') playerId: string,
    @Body('type') type: string,
    @Body('eventMinute') eventMinute: number,
    @Body('description') description: string,
  ) {
    if (eventMinute === undefined || eventMinute === null) {
      throw new BadRequestException('Trường eventMinute là bắt buộc');
    }

    const minute = Number(eventMinute);
    if (isNaN(minute) || minute < 1 || minute > 120) {
      throw new BadRequestException('eventMinute phải là số từ 1 đến 120');
    }

    if (!this.supabase) {
      throw new BadRequestException('Supabase chưa được cấu hình');
    }

    const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await this.supabase
      .from('su_kien')
      .insert([
        {
          id: eventId,
          tran_dau_id: matchId,
          doi_id: teamId,
          cau_thu_id: playerId,
          loai: type,
          phut: minute,
          mo_ta: description,
        },
      ]);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { success: true, eventId };
  }
}
