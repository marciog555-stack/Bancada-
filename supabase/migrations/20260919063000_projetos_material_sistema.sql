alter table public.projetos
  add column material_sistema text
  check (material_sistema in ('wpc', 'pvc', 'gesso', 'drywall', 'outro'));
