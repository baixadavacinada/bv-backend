import { getFirebaseAuth } from '../config/firebase';
import { Logger } from '../middlewares/logging';

// Tipos unificados para sistema de claims
export type UserRole = 'admin' | 'agent' | 'public';

export type Permission = 
  | 'read_users' | 'write_users' | 'delete_users'
  | 'read_health_units' | 'write_health_units'
  | 'read_vaccines' | 'write_vaccines'
  | 'read_appointments' | 'write_appointments'
  | 'read_records' | 'write_records'
  | 'read_feedback' | 'moderate_feedback'
  | 'read_notifications' | 'send_notifications';

export interface UserClaims {
  role: UserRole;
  permissions: Permission[];
  profile: {
    hasBasicInfo: boolean;
    hasHealthInfo: boolean;
    profileCompleteness: number;
  };
  metadata: {
    lastLogin: string;
    createdAt: string;
    updatedAt: string;
    updatedBy?: string;
    lastRoleUpdate?: string;
  };
  isActive: boolean;
  ubsId?: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'read_users', 'write_users', 'delete_users',
    'read_health_units', 'write_health_units',
    'read_vaccines', 'write_vaccines',
    'read_appointments', 'write_appointments',
    'read_records', 'write_records',
    'read_feedback', 'moderate_feedback',
    'read_notifications', 'send_notifications'
  ],
  agent: [
    'read_health_units',
    'read_vaccines', 
    'read_appointments', 'write_appointments',
    'read_records', 'write_records',
    'read_feedback',
    'read_notifications'
  ],
  public: [
    'read_health_units',
    'read_vaccines'
  ]
};

const logger = Logger.getInstance();

export class ClaimsService {
  private auth = getFirebaseAuth();

  /**
   * Atualiza claims de um usuário com validação completa
   */
  async updateUserClaims(
    uid: string, 
    claims: Partial<UserClaims>,
    updatedBy: string
  ): Promise<UserClaims> {
    try {
      // Busca claims atuais
      const userRecord = await this.auth.getUser(uid);
      const currentClaims = (userRecord.customClaims as UserClaims) || this.getDefaultClaims();

      // Merge com novas claims, preservando campos obrigatórios
      const now = new Date().toISOString();
      const newClaims: UserClaims = {
        ...currentClaims,
        ...claims,
        metadata: {
          ...currentClaims.metadata,
          updatedAt: now,
          lastRoleUpdate: now,
          updatedBy,
        }
      };

      // Valida e normaliza as claims
      const validatedClaims = this.validateAndNormalizeClaims(newClaims);

      // Atualiza no Firebase
      await this.auth.setCustomUserClaims(uid, validatedClaims);

      logger.info('User claims updated successfully', {
        uid,
        previousRole: currentClaims.role,
        newRole: validatedClaims.role,
        updatedBy
      });

      return validatedClaims;
    } catch (error) {
      logger.error('Failed to update user claims', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Busca claims de um usuário
   */
  async getUserClaims(uid: string): Promise<UserClaims> {
    try {
      const userRecord = await this.auth.getUser(uid);
      const claims = userRecord.customClaims as UserClaims;
      
      return claims || this.getDefaultClaims();
    } catch (error) {
      logger.error('Failed to get user claims', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Verifica se usuário tem permissão específica
   */
  async hasPermission(uid: string, permission: Permission): Promise<boolean> {
    try {
      const claims = await this.getUserClaims(uid);
      return claims.permissions.includes(permission);
    } catch {
      return false;
    }
  }

  /**
   * Verifica se usuário tem role específica ou superior
   */
  async hasRole(uid: string, requiredRole: UserRole): Promise<boolean> {
    try {
      const claims = await this.getUserClaims(uid);
      
      // Admin pode tudo
      if (claims.role === 'admin') return true;
      
      // Agent pode acessar recursos de public
      if (requiredRole === 'public' && claims.role === 'agent') {
        return true;
      }
      
      // Verificação exata
      return claims.role === requiredRole;
    } catch {
      return false;
    }
  }

  /**
   * Define claims padrão para novos usuários
   */
  async setDefaultClaimsForNewUser(uid: string): Promise<UserClaims> {
    const defaultClaims = this.getDefaultClaims();
    await this.auth.setCustomUserClaims(uid, defaultClaims);
    
    logger.info('Default claims set for new user', { uid, claims: defaultClaims });
    return defaultClaims;
  }

  /**
   * Atualiza role e ajusta permissões automaticamente
   */
  async updateUserRole(uid: string, newRole: UserRole, updatedBy: string): Promise<UserClaims> {
    const defaultPermissions = ROLE_PERMISSIONS[newRole];
    
    return this.updateUserClaims(uid, {
      role: newRole,
      permissions: defaultPermissions,
      isActive: true
    }, updatedBy);
  }

  /**
   * Desativa usuário (mantém claims mas marca como inativo)
   */
  async deactivateUser(uid: string, updatedBy: string): Promise<UserClaims> {
    return this.updateUserClaims(uid, {
      isActive: false
    }, updatedBy);
  }

  /**
   * Reativa usuário
   */
  async reactivateUser(uid: string, updatedBy: string): Promise<UserClaims> {
    return this.updateUserClaims(uid, {
      isActive: true
    }, updatedBy);
  }

  /**
   * Valida e normaliza claims antes de salvar
   */
  private validateAndNormalizeClaims(claims: UserClaims): UserClaims {
    // Valida role
    if (!['admin', 'agent', 'public'].includes(claims.role)) {
      throw new Error(`Invalid role: ${claims.role}`);
    }

    // Normaliza permissões - remove duplicatas e valida
    const validPermissions = [
      'manage_users', 'manage_health_units', 'manage_vaccines',
      'view_reports', 'edit_appointments', 'manage_notifications',
      'view_analytics', 'export_data'
    ];

    const normalizedPermissions = [...new Set(claims.permissions)].filter(
      (perm): perm is Permission => validPermissions.includes(perm as string)
    );

    // Garante que admin sempre tem todas as permissões
    if (claims.role === 'admin') {
      claims.permissions = ROLE_PERMISSIONS.admin;
    } else {
      claims.permissions = normalizedPermissions;
    }

    // Valida UBS ID se presente
    if (claims.ubsId && typeof claims.ubsId !== 'string') {
      delete claims.ubsId;
    }

    // Garante isActive como boolean
    claims.isActive = Boolean(claims.isActive);

    return claims;
  }

  /**
   * Claims padrão para novos usuários
   */
  private getDefaultClaims(): UserClaims {
    const now = new Date().toISOString();
    return {
      role: 'public',
      permissions: [],
      isActive: true,
      profile: {
        hasBasicInfo: false,
        hasHealthInfo: false,
        profileCompleteness: 0
      },
      metadata: {
        lastLogin: now,
        createdAt: now,
        updatedAt: now,
        lastRoleUpdate: now,
      }
    };
  }
}

export const claimsService = new ClaimsService();