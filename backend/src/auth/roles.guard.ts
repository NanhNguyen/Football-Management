import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class RolesGuard implements CanActivate {
  private supabase;
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://mjbwdzgccxpahlkoksex.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_626NQt7MhaX9abfCpCoEZw_G6gVioj1';
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.sub) {
      this.logger.warn('User not found in request');
      return false;
    }

    // Query role from Supabase user_roles table
    const { data, error } = await this.supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', user.sub)
      .single();

    if (error || !data) {
      this.logger.error(`Error fetching role for user ${user.sub}`, error);
      return false;
    }

    const roleId = data.role_id || 3;
    const roleMap: Record<number, string> = { 1: 'admin', 2: 'ref', 3: 'user' };
    const userRole = roleMap[roleId] || 'user';

    const hasRole = requiredRoles.includes(userRole);
    if (!hasRole) {
      throw new ForbiddenException(`Require one of these roles: ${requiredRoles.join(', ')}`);
    }

    // Add role to user object for controllers to use if needed
    user.role = userRole;


    return true;
  }
}
