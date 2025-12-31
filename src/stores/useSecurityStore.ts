import { create } from "zustand";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

interface SecuritySettings {
  id?: number;
  authEnabled: boolean;
  authMethod: "pin" | "biometric" | "both";
  pinHash?: string;
  sessionTimeout: number; // em minutos (0 = nunca)
  lastActivity?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface SecurityStore {
  isAuthenticated: boolean;
  settings: SecuritySettings | null;
  isLoading: boolean;

  // Ações
  fetchSettings: () => Promise<void>;
  enableAuth: (pin: string, timeout: number) => Promise<void>;
  disableAuth: () => Promise<void>;
  validatePin: (pin: string) => Promise<boolean>;
  updateTimeout: (timeout: number) => Promise<void>;
  checkSession: () => boolean;
  updateActivity: () => void;
  logout: () => void;
  resetAllData: () => Promise<void>;
}

const SESSION_KEY = 'financeAppSession'

export const useSecurityStore = create<SecurityStore>((set, get) => ({
  isAuthenticated: false,
  settings: null,
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true })
    try {
        const settings = await db.security.toArray()
        const currentSettings = settings[0] || null
        
        if (currentSettings?.authEnabled) {
        const hasActiveSession = sessionStorage.getItem(SESSION_KEY) === 'true'
        
        set({ 
            settings: currentSettings, 
            isAuthenticated: hasActiveSession,
            isLoading: false 
        })
        } else {
            set({ 
                settings: currentSettings, 
                isAuthenticated: true,
                isLoading: false 
            })
            }
        } catch (error) {
            console.error('Erro ao buscar configurações de segurança:', error)
            set({ isLoading: false, isAuthenticated: true })
        }
    },

  enableAuth: async (pin: string, timeout: number) => {
    set({ isLoading: true });
    try {
      // Gerar hash do PIN
      const salt = await bcrypt.genSalt(10);
      const pinHash = await bcrypt.hash(pin, salt);

      const now = new Date();
      const newSettings: SecuritySettings = {
        authEnabled: true,
        authMethod: "pin",
        pinHash,
        sessionTimeout: timeout,
        lastActivity: now,
        createdAt: now,
        updatedAt: now,
      };

      // Limpar configurações antigas
      await db.security.clear();

      // Adicionar nova configuração
      await db.security.add(newSettings);

      set({
        settings: newSettings,
        isAuthenticated: true, // Fica autenticado ao habilitar
        isLoading: false,
      });
    } catch (error) {
      console.error("Erro ao habilitar autenticação:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  disableAuth: async () => {
    set({ isLoading: true })
    try {
        await db.security.clear()
        
        sessionStorage.removeItem(SESSION_KEY)
        
        set({ 
        settings: null, 
        isAuthenticated: true, 
        isLoading: false 
        })
    } catch (error) {
        console.error('Erro ao desabilitar autenticação:', error)
        set({ isLoading: false })
        throw error
    }
  },

  validatePin: async (pin: string) => {
    const { settings } = get()
    
    if (!settings?.pinHash) return false

    try {
        const isValid = await bcrypt.compare(pin, settings.pinHash)
        
        if (isValid) {
        const now = new Date()
        
        // Atualizar última atividade
        await db.security.update(settings.id!, {
            lastActivity: now,
            updatedAt: now
        })

        // Salvar sessão no sessionStorage
        sessionStorage.setItem(SESSION_KEY, 'true')

        set({ 
            isAuthenticated: true,
            settings: { ...settings, lastActivity: now, updatedAt: now }
        })
        }
        
        return isValid
    } catch (error) {
        console.error('Erro ao validar PIN:', error)
        return false
    }
  },

  updateTimeout: async (timeout: number) => {
    const { settings } = get();
    if (!settings?.id) return;

    try {
      await db.security.update(settings.id, {
        sessionTimeout: timeout,
        updatedAt: new Date(),
      });

      set({
        settings: { ...settings, sessionTimeout: timeout },
      });
    } catch (error) {
      console.error("Erro ao atualizar timeout:", error);
      throw error;
    }
  },

  checkSession: () => {
    const { settings } = get()
    
    // Se não tem auth habilitado, sempre autenticado
    if (!settings?.authEnabled) return true
    
    // Verificar se tem sessão no sessionStorage
    const hasActiveSession = sessionStorage.getItem(SESSION_KEY) === 'true'
    
    if (!hasActiveSession) {
      set({ isAuthenticated: false })
      return false
    }
    
    // Se tem sessão E timeout NÃO é 0, verificar expiração por tempo
    if (settings.sessionTimeout !== 0 && settings.lastActivity) {
      const now = new Date()
      const lastActivity = new Date(settings.lastActivity)
      const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60)
      
      if (diffMinutes > settings.sessionTimeout) {
        sessionStorage.removeItem(SESSION_KEY)
        set({ isAuthenticated: false })
        return false
      }
    }
    
    // Sessão válida
    set({ isAuthenticated: true })
    return true
  },

  updateActivity: () => {
    const { settings, isAuthenticated } = get();

    if (!settings?.authEnabled || !isAuthenticated) return;

    const now = new Date();

    // Atualizar no banco (sem await para não bloquear)
    if (settings.id) {
      db.security
        .update(settings.id, {
          lastActivity: now,
          updatedAt: now,
        })
        .catch(console.error);
    }

    set({
      settings: { ...settings, lastActivity: now, updatedAt: now },
    });
  },

  logout: () => {
    sessionStorage.removeItem(SESSION_KEY)
    set({ isAuthenticated: false })
  },

  resetAllData: async () => {
    try {
      await db.accounts.clear();
      await db.categories.clear();
      await db.transactions.clear();
      await db.budgets.clear();
      await db.security.clear();

      localStorage.removeItem("hasCompletedInitialSetup");
      localStorage.removeItem("hasSeenWelcome");

      set({
        settings: null,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error("Erro ao resetar dados:", error);
      throw error;
    }
  },
}));
