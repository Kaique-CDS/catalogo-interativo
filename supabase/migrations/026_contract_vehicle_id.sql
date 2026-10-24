-- ==============================================================================
-- Migration 026: Vínculo de Contrato com Veículo do Estoque (vehicle_id)
-- Idempotente, com chave estrangeira e índice de performance.
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'contracts' 
      AND column_name = 'vehicle_id'
  ) THEN
    ALTER TABLE public.contracts
      ADD COLUMN vehicle_id uuid NULL REFERENCES public.vehicles(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contracts_vehicle_id 
  ON public.contracts(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_contracts_store_vehicle 
  ON public.contracts(store_id, vehicle_id);
