-- Beneficios — CHECK de academy_points_transactions.tipo + versión final de funciones
-- Ya aplicada en producción. Versionado para paridad del repo.
-- El pool de créditos ahora admite: 'ganado' | 'canjeado' | 'vencido'.

ALTER TABLE public.academy_points_transactions DROP CONSTRAINT IF EXISTS academy_points_transactions_tipo_check;
ALTER TABLE public.academy_points_transactions
  ADD CONSTRAINT academy_points_transactions_tipo_check
  CHECK (tipo = ANY (ARRAY['ganado','canjeado','vencido']));

-- Versión final (idéntica a la que corre en prod) de redeem_benefit y
-- expire_credits_run. Se re-declaran acá para que el repo refleje el estado
-- final tras el ajuste de tipos. Ver 20260718182013 y 20260718182045.
-- (Sin cambios de firma; CREATE OR REPLACE es idempotente.)
