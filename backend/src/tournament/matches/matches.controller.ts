import { Controller, Post, Param, BadRequestException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { MatchTimerManager } from '../match-timer.manager';

@Controller('matches')
export class MatchesController {
  private supabase: any;

  constructor(private readonly matchTimerManager: MatchTimerManager) {
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

  private async setupSafetyTimeout(matchId: string, period: 'HALF_1' | 'HALF_2', startTime: number) {
    if (!this.supabase) return;
    
    // Fetch match duration
    const { data: match } = await this.supabase
      .from('tran_dau')
      .select('giai_dau_id, giai_dau(cai_dat)')
      .eq('id', matchId)
      .single();
      
    let matchDuration = 90;
    if (match?.giai_dau?.cai_dat?.matchDurationMinutes) {
      matchDuration = Number(match.giai_dau.cai_dat.matchDurationMinutes);
    }
    
    const halfDuration = matchDuration / 2;
    const safetyLimitMinutes = halfDuration + 15;
    
    const timeoutId = setTimeout(async () => {
      console.log(`[SafetyTimeout] Triggered for match ${matchId} period ${period}`);
      if (period === 'HALF_1') {
        const endTime = new Date(startTime + halfDuration * 60 * 1000).toISOString();
        await this.supabase.from('tran_dau').update({
          current_period: 'BREAK',
          half1_end_time: endTime
        }).eq('id', matchId);
      } else if (period === 'HALF_2') {
        const endTime = new Date(startTime + halfDuration * 60 * 1000).toISOString();
        await this.supabase.from('tran_dau').update({
          trang_thai: 'KET_THUC',
          current_period: 'FINISHED',
          half2_end_time: endTime
        }).eq('id', matchId);
      }
      this.matchTimerManager.clearMatchTimer(matchId);
    }, safetyLimitMinutes * 60 * 1000);
    
    this.matchTimerManager.addTimer(matchId, timeoutId);
  }

  @Post(':id/start-half1')
  async startHalf1(@Param('id') id: string) {
    if (!this.supabase) throw new BadRequestException('Supabase chưa được cấu hình');
    const now = new Date();
    const { data, error } = await this.supabase
      .from('tran_dau')
      .update({
        trang_thai: 'DANG_DIEN_RA',
        current_period: 'HALF_1',
        half1_start_time: now.toISOString()
      })
      .eq('id', id);
      
    if (error) throw new BadRequestException(error.message);
    
    await this.setupSafetyTimeout(id, 'HALF_1', now.getTime());
    
    return { success: true };
  }

  @Post(':id/end-half1')
  async endHalf1(@Param('id') id: string) {
    if (!this.supabase) throw new BadRequestException('Supabase chưa được cấu hình');
    
    this.matchTimerManager.clearMatchTimer(id);
    
    const { data, error } = await this.supabase
      .from('tran_dau')
      .update({
        current_period: 'BREAK',
        half1_end_time: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }

  @Post(':id/start-half2')
  async startHalf2(@Param('id') id: string) {
    if (!this.supabase) throw new BadRequestException('Supabase chưa được cấu hình');
    const now = new Date();
    const { data, error } = await this.supabase
      .from('tran_dau')
      .update({
        current_period: 'HALF_2',
        half2_start_time: now.toISOString()
      })
      .eq('id', id);
      
    if (error) throw new BadRequestException(error.message);
    
    await this.setupSafetyTimeout(id, 'HALF_2', now.getTime());
    
    return { success: true };
  }

  @Post(':id/end-match')
  async endMatch(@Param('id') id: string) {
    if (!this.supabase) throw new BadRequestException('Supabase chưa được cấu hình');
    
    this.matchTimerManager.clearMatchTimer(id);
    
    const { data, error } = await this.supabase
      .from('tran_dau')
      .update({
        trang_thai: 'KET_THUC',
        current_period: 'FINISHED',
        half2_end_time: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }
}
