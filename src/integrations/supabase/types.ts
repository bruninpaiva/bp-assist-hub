export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      agenda_eventos: {
        Row: {
          cliente_id: string | null
          concluido: boolean
          created_at: string
          deleted_at: string | null
          descricao: string | null
          fim: string | null
          id: string
          inicio: string
          local: string | null
          os_id: string | null
          responsavel_id: string | null
          tipo: Database["public"]["Enums"]["tipo_agenda"]
          titulo: string
          updated_at: string
        }
        Insert: {
          cliente_id?: string | null
          concluido?: boolean
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          fim?: string | null
          id?: string
          inicio?: string
          local?: string | null
          os_id?: string | null
          responsavel_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_agenda"]
          titulo: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string | null
          concluido?: boolean
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          fim?: string | null
          id?: string
          inicio?: string
          local?: string | null
          os_id?: string | null
          responsavel_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_agenda"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_eventos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_eventos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_financeiras: {
        Row: {
          cor: string | null
          created_at: string
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["tipo_lancamento"]
          updated_at: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          tipo: Database["public"]["Enums"]["tipo_lancamento"]
          updated_at?: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["tipo_lancamento"]
          updated_at?: string
        }
        Relationships: []
      }
      categorias_produto: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      checklist_itens: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          ativo: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          complemento: string | null
          cpf: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          endereco: string | null
          id: string
          inscricao_estadual: string | null
          nome: string
          nome_fantasia: string | null
          numero: string | null
          observacoes: string | null
          razao_social: string | null
          telefone: string | null
          tipo_pessoa: Database["public"]["Enums"]["tipo_pessoa"]
          uf: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          inscricao_estadual?: string | null
          nome: string
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          razao_social?: string | null
          telefone?: string | null
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa"]
          uf?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          inscricao_estadual?: string | null
          nome?: string
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          razao_social?: string | null
          telefone?: string | null
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa"]
          uf?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      empresa: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          logo_url: string | null
          nome_fantasia: string
          numero: string | null
          observacoes_padrao: string | null
          razao_social: string | null
          site: string | null
          telefone: string | null
          uf: string | null
          updated_at: string
          validade_orcamento_dias: number
          whatsapp: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome_fantasia?: string
          numero?: string | null
          observacoes_padrao?: string | null
          razao_social?: string | null
          site?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
          validade_orcamento_dias?: number
          whatsapp?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome_fantasia?: string
          numero?: string | null
          observacoes_padrao?: string | null
          razao_social?: string | null
          site?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
          validade_orcamento_dias?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      equipamento_checklist: {
        Row: {
          created_at: string
          equipamento_id: string
          id: string
          item_id: string | null
          observacao: string | null
          presente: boolean
        }
        Insert: {
          created_at?: string
          equipamento_id: string
          id?: string
          item_id?: string | null
          observacao?: string | null
          presente?: boolean
        }
        Update: {
          created_at?: string
          equipamento_id?: string
          id?: string
          item_id?: string | null
          observacao?: string | null
          presente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "equipamento_checklist_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipamento_checklist_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamento_eventos: {
        Row: {
          created_at: string
          descricao: string | null
          equipamento_id: string
          id: string
          status: Database["public"]["Enums"]["status_equipamento"] | null
          titulo: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          equipamento_id: string
          id?: string
          status?: Database["public"]["Enums"]["status_equipamento"] | null
          titulo: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          equipamento_id?: string
          id?: string
          status?: Database["public"]["Enums"]["status_equipamento"] | null
          titulo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipamento_eventos_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamento_fotos: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_foto"]
          created_at: string
          created_by: string | null
          equipamento_id: string
          id: string
          storage_path: string
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["categoria_foto"]
          created_at?: string
          created_by?: string | null
          equipamento_id: string
          id?: string
          storage_path: string
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_foto"]
          created_at?: string
          created_by?: string | null
          equipamento_id?: string
          id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipamento_fotos_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos: {
        Row: {
          acessorios: string | null
          armazenamento: string | null
          cliente_id: string | null
          created_at: string
          data_entrada: string
          defeito_informado: string | null
          deleted_at: string | null
          diagnostico: string | null
          estado_fisico: string | null
          fotos: string[]
          garantia_ate: string | null
          id: string
          marca: string | null
          memoria_ram: string | null
          modelo: string | null
          numero_serie: string | null
          observacoes: string | null
          patrimonio: string | null
          previsao_entrega: string | null
          processador: string | null
          senha_informada: string | null
          sistema_operacional: string | null
          status: Database["public"]["Enums"]["status_equipamento"]
          tipo: Database["public"]["Enums"]["tipo_equipamento"]
          updated_at: string
        }
        Insert: {
          acessorios?: string | null
          armazenamento?: string | null
          cliente_id?: string | null
          created_at?: string
          data_entrada?: string
          defeito_informado?: string | null
          deleted_at?: string | null
          diagnostico?: string | null
          estado_fisico?: string | null
          fotos?: string[]
          garantia_ate?: string | null
          id?: string
          marca?: string | null
          memoria_ram?: string | null
          modelo?: string | null
          numero_serie?: string | null
          observacoes?: string | null
          patrimonio?: string | null
          previsao_entrega?: string | null
          processador?: string | null
          senha_informada?: string | null
          sistema_operacional?: string | null
          status?: Database["public"]["Enums"]["status_equipamento"]
          tipo?: Database["public"]["Enums"]["tipo_equipamento"]
          updated_at?: string
        }
        Update: {
          acessorios?: string | null
          armazenamento?: string | null
          cliente_id?: string | null
          created_at?: string
          data_entrada?: string
          defeito_informado?: string | null
          deleted_at?: string | null
          diagnostico?: string | null
          estado_fisico?: string | null
          fotos?: string[]
          garantia_ate?: string | null
          id?: string
          marca?: string | null
          memoria_ram?: string | null
          modelo?: string | null
          numero_serie?: string | null
          observacoes?: string | null
          patrimonio?: string | null
          previsao_entrega?: string | null
          processador?: string | null
          senha_informada?: string | null
          sistema_operacional?: string | null
          status?: Database["public"]["Enums"]["status_equipamento"]
          tipo?: Database["public"]["Enums"]["tipo_equipamento"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          cidade: string | null
          cnpj: string | null
          contato: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lancamentos: {
        Row: {
          categoria_id: string | null
          cliente_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string | null
          deleted_at: string | null
          descricao: string
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          orcamento_id: string | null
          os_id: string | null
          status: Database["public"]["Enums"]["status_lancamento"]
          tipo: Database["public"]["Enums"]["tipo_lancamento"]
          updated_at: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          cliente_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          deleted_at?: string | null
          descricao: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          orcamento_id?: string | null
          os_id?: string | null
          status?: Database["public"]["Enums"]["status_lancamento"]
          tipo: Database["public"]["Enums"]["tipo_lancamento"]
          updated_at?: string
          valor?: number
        }
        Update: {
          categoria_id?: string | null
          cliente_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          deleted_at?: string | null
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          orcamento_id?: string | null
          os_id?: string | null
          status?: Database["public"]["Enums"]["status_lancamento"]
          tipo?: Database["public"]["Enums"]["tipo_lancamento"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string
          custo_unitario: number | null
          id: string
          observacoes: string | null
          os_id: string | null
          produto_id: string
          quantidade: number
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          custo_unitario?: number | null
          id?: string
          observacoes?: string | null
          os_id?: string | null
          produto_id: string
          quantidade: number
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          custo_unitario?: number | null
          id?: string
          observacoes?: string | null
          os_id?: string | null
          produto_id?: string
          quantidade?: number
          tipo?: Database["public"]["Enums"]["tipo_movimentacao"]
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_eventos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          orcamento_id: string
          status: Database["public"]["Enums"]["status_orcamento"] | null
          titulo: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          orcamento_id: string
          status?: Database["public"]["Enums"]["status_orcamento"] | null
          titulo: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          orcamento_id?: string
          status?: Database["public"]["Enums"]["status_orcamento"] | null
          titulo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_eventos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_itens: {
        Row: {
          created_at: string
          desconto: number
          descricao: string
          id: string
          orcamento_id: string
          ordem: number
          quantidade: number
          subtotal: number | null
          tipo: Database["public"]["Enums"]["tipo_item_orcamento"]
          updated_at: string
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          desconto?: number
          descricao: string
          id?: string
          orcamento_id: string
          ordem?: number
          quantidade?: number
          subtotal?: number | null
          tipo?: Database["public"]["Enums"]["tipo_item_orcamento"]
          updated_at?: string
          valor_unitario?: number
        }
        Update: {
          created_at?: string
          desconto?: number
          descricao?: string
          id?: string
          orcamento_id?: string
          ordem?: number
          quantidade?: number
          subtotal?: number | null
          tipo?: Database["public"]["Enums"]["tipo_item_orcamento"]
          updated_at?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          ano: number
          cliente_id: string | null
          condicoes_pagamento: string | null
          created_at: string
          created_by: string | null
          data_aprovacao: string | null
          data_emissao: string
          deleted_at: string | null
          desconto: number
          equipamento_id: string | null
          id: string
          numero: number
          observacoes: string | null
          os_id: string
          prazo_entrega: string | null
          status: Database["public"]["Enums"]["status_orcamento"]
          subtotal: number
          titulo: string | null
          total: number
          updated_at: string
          validade_dias: number
        }
        Insert: {
          ano?: number
          cliente_id?: string | null
          condicoes_pagamento?: string | null
          created_at?: string
          created_by?: string | null
          data_aprovacao?: string | null
          data_emissao?: string
          deleted_at?: string | null
          desconto?: number
          equipamento_id?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          os_id: string
          prazo_entrega?: string | null
          status?: Database["public"]["Enums"]["status_orcamento"]
          subtotal?: number
          titulo?: string | null
          total?: number
          updated_at?: string
          validade_dias?: number
        }
        Update: {
          ano?: number
          cliente_id?: string | null
          condicoes_pagamento?: string | null
          created_at?: string
          created_by?: string | null
          data_aprovacao?: string | null
          data_emissao?: string
          deleted_at?: string | null
          desconto?: number
          equipamento_id?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          os_id?: string
          prazo_entrega?: string | null
          status?: Database["public"]["Enums"]["status_orcamento"]
          subtotal?: number
          titulo?: string | null
          total?: number
          updated_at?: string
          validade_dias?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          ano: number
          cliente_id: string
          created_at: string
          created_by: string | null
          data_conclusao: string | null
          data_entrada: string
          data_entrega: string | null
          deleted_at: string | null
          desconto: number
          diagnostico: string | null
          equipamento_id: string
          garantia_dias: number
          id: string
          numero: number
          numero_os: string | null
          observacoes: string | null
          previsao_entrega: string | null
          prioridade: Database["public"]["Enums"]["prioridade"]
          problema_relatado: string
          solucao: string | null
          status: Database["public"]["Enums"]["status_ordem_servico"]
          tecnico_responsavel: string | null
          updated_at: string
          valor_mao_obra: number
          valor_total: number
        }
        Insert: {
          ano?: number
          cliente_id: string
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_entrada?: string
          data_entrega?: string | null
          deleted_at?: string | null
          desconto?: number
          diagnostico?: string | null
          equipamento_id: string
          garantia_dias?: number
          id?: string
          numero?: number
          numero_os?: string | null
          observacoes?: string | null
          previsao_entrega?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade"]
          problema_relatado: string
          solucao?: string | null
          status?: Database["public"]["Enums"]["status_ordem_servico"]
          tecnico_responsavel?: string | null
          updated_at?: string
          valor_mao_obra?: number
          valor_total?: number
        }
        Update: {
          ano?: number
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_entrada?: string
          data_entrega?: string | null
          deleted_at?: string | null
          desconto?: number
          diagnostico?: string | null
          equipamento_id?: string
          garantia_dias?: number
          id?: string
          numero?: number
          numero_os?: string | null
          observacoes?: string | null
          previsao_entrega?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade"]
          problema_relatado?: string
          solucao?: string | null
          status?: Database["public"]["Enums"]["status_ordem_servico"]
          tecnico_responsavel?: string | null
          updated_at?: string
          valor_mao_obra?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      os_eventos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          os_id: string
          status: Database["public"]["Enums"]["status_ordem_servico"] | null
          titulo: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          os_id: string
          status?: Database["public"]["Enums"]["status_ordem_servico"] | null
          titulo: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          os_id?: string
          status?: Database["public"]["Enums"]["status_ordem_servico"] | null
          titulo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "os_eventos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria_id: string | null
          created_at: string
          deleted_at: string | null
          descricao: string | null
          estoque_atual: number
          estoque_minimo: number
          fornecedor_id: string | null
          id: string
          nome: string
          preco_custo: number
          preco_venda: number
          sku: string | null
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          estoque_atual?: number
          estoque_minimo?: number
          fornecedor_id?: string | null
          id?: string
          nome: string
          preco_custo?: number
          preco_venda?: number
          sku?: string | null
          unidade?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          estoque_atual?: number
          estoque_minimo?: number
          fornecedor_id?: string | null
          id?: string
          nome?: string
          preco_custo?: number
          preco_venda?: number
          sku?: string | null
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_produto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          cargo: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "tecnico" | "financeiro" | "atendente"
      categoria_foto: "entrada" | "durante_manutencao" | "final" | "entrega"
      prioridade: "baixa" | "media" | "alta" | "urgente"
      status_equipamento:
        | "recebido"
        | "em_analise"
        | "aguardando_orcamento"
        | "aguardando_aprovacao"
        | "aguardando_peca"
        | "em_manutencao"
        | "pronto"
        | "entregue"
        | "cancelado"
      status_lancamento: "pendente" | "pago" | "atrasado" | "cancelado"
      status_orcamento:
        | "rascunho"
        | "enviado"
        | "aprovado"
        | "recusado"
        | "expirado"
        | "cancelado"
      status_ordem_servico:
        | "recebido"
        | "em_analise"
        | "aguardando_orcamento"
        | "aguardando_aprovacao"
        | "aguardando_peca"
        | "em_manutencao"
        | "teste"
        | "pronto"
        | "entregue"
        | "cancelado"
      status_os:
        | "aberta"
        | "em_analise"
        | "aguardando_aprovacao"
        | "aguardando_peca"
        | "em_execucao"
        | "concluida"
        | "entregue"
        | "cancelada"
      tipo_agenda:
        | "visita"
        | "retirada"
        | "entrega"
        | "manutencao"
        | "compromisso"
      tipo_equipamento:
        | "notebook"
        | "desktop"
        | "servidor"
        | "monitor"
        | "impressora"
        | "switch"
        | "roteador"
        | "nobreak"
        | "outros"
      tipo_item_orcamento: "produto" | "servico"
      tipo_lancamento: "entrada" | "saida"
      tipo_movimentacao: "entrada" | "saida" | "ajuste"
      tipo_pessoa: "fisica" | "juridica"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "tecnico", "financeiro", "atendente"],
      categoria_foto: ["entrada", "durante_manutencao", "final", "entrega"],
      prioridade: ["baixa", "media", "alta", "urgente"],
      status_equipamento: [
        "recebido",
        "em_analise",
        "aguardando_orcamento",
        "aguardando_aprovacao",
        "aguardando_peca",
        "em_manutencao",
        "pronto",
        "entregue",
        "cancelado",
      ],
      status_lancamento: ["pendente", "pago", "atrasado", "cancelado"],
      status_orcamento: [
        "rascunho",
        "enviado",
        "aprovado",
        "recusado",
        "expirado",
        "cancelado",
      ],
      status_ordem_servico: [
        "recebido",
        "em_analise",
        "aguardando_orcamento",
        "aguardando_aprovacao",
        "aguardando_peca",
        "em_manutencao",
        "teste",
        "pronto",
        "entregue",
        "cancelado",
      ],
      status_os: [
        "aberta",
        "em_analise",
        "aguardando_aprovacao",
        "aguardando_peca",
        "em_execucao",
        "concluida",
        "entregue",
        "cancelada",
      ],
      tipo_agenda: [
        "visita",
        "retirada",
        "entrega",
        "manutencao",
        "compromisso",
      ],
      tipo_equipamento: [
        "notebook",
        "desktop",
        "servidor",
        "monitor",
        "impressora",
        "switch",
        "roteador",
        "nobreak",
        "outros",
      ],
      tipo_item_orcamento: ["produto", "servico"],
      tipo_lancamento: ["entrada", "saida"],
      tipo_movimentacao: ["entrada", "saida", "ajuste"],
      tipo_pessoa: ["fisica", "juridica"],
    },
  },
} as const
