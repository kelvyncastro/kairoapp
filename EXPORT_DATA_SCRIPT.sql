-- ============================================
-- KAIRO APP - SCRIPT DE EXPORTAÇÃO DE DADOS
-- Exportar dados do Lovable Cloud para migração
-- ============================================
-- 
-- INSTRUÇÕES DE USO:
-- 1. Execute este script no seu banco de dados Lovable Cloud (atual)
-- 2. Copie os resultados de cada SELECT
-- 3. Execute no seu Supabase externo para importar os dados
--
-- ============================================

-- ============================================
-- EXPORTAR DADOS - ORDEM RESPEITANDO FOREIGN KEYS
-- ============================================

-- 1. user_roles (sem dependências)
SELECT 'INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || role || ''', ''' || created_at || ''')' , ',')
FROM public.user_roles;

-- 2. user_profiles (sem dependências)
SELECT 'INSERT INTO public.user_profiles (id, user_id, first_name, last_name, birth_date, avatar_url, app_theme, public_id, subscription_status, phone_number, onboarding_completed, created_at, updated_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ' || COALESCE('''' || first_name || '''', 'NULL') || ', ' || COALESCE('''' || last_name || '''', 'NULL') || ', ' || COALESCE('''' || birth_date || '''', 'NULL') || ', ' || COALESCE('''' || avatar_url || '''', 'NULL') || ', ''' || app_theme || ''', ' || COALESCE('''' || public_id || '''', 'NULL') || ', ''' || subscription_status || ''', ' || COALESCE('''' || phone_number || '''', 'NULL') || ', ' || onboarding_completed || ', ''' || created_at || ''', ''' || updated_at || ''')' , ',')
FROM public.user_profiles;

-- 3. user_settings (sem dependências)
SELECT 'INSERT INTO public.user_settings (id, user_id, calories_target, protein_target, carbs_target, fat_target, fiber_target, rest_timer_default_seconds, daily_reset_time, week_starts_on, streak_rule, units, theme, created_at, updated_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ' || COALESCE(calories_target::text, 'NULL') || ', ' || COALESCE(protein_target::text, 'NULL') || ', ' || COALESCE(carbs_target::text, 'NULL') || ', ' || COALESCE(fat_target::text, 'NULL') || ', ' || COALESCE(fiber_target::text, 'NULL') || ', ' || COALESCE(rest_timer_default_seconds::text, 'NULL') || ', ' || COALESCE('''' || daily_reset_time || '''', 'NULL') || ', ' || COALESCE(week_starts_on::text, 'NULL') || ', ' || COALESCE('''' || streak_rule || '''', 'NULL') || ', ' || COALESCE('''' || units || '''', 'NULL') || ', ' || COALESCE('''' || theme || '''', 'NULL') || ', ''' || created_at || ''', ''' || updated_at || ''')' , ',')
FROM public.user_settings;

-- 4. task_folders (sem dependências)
SELECT 'INSERT INTO public.task_folders (id, user_id, name, icon, color, "order", created_at, updated_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || name || ''', ''' || icon || ''', ''' || color || ''', ' || COALESCE("order"::text, '0') || ', ''' || created_at || ''', ' || COALESCE('''' || updated_at || '''', 'NULL') || ')' , ',')
FROM public.task_folders;

-- 5. task_statuses (sem dependências)
SELECT 'INSERT INTO public.task_statuses (id, user_id, name, color, "order", is_default, created_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || name || ''', ''' || color || ''', ' || COALESCE("order"::text, '0') || ', ' || is_default || ', ''' || created_at || ''')' , ',')
FROM public.task_statuses;

-- 6. task_labels (sem dependências)
SELECT 'INSERT INTO public.task_labels (id, user_id, name, color, created_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || name || ''', ''' || color || ''', ''' || created_at || ''')' , ',')
FROM public.task_labels;

-- 7. daily_tasks (depende de task_folders e task_statuses)
SELECT 'INSERT INTO public.daily_tasks (id, user_id, title, description, date, folder_id, status_id, priority, labels, completed, completed_at, due_date, start_date, time_estimate_minutes, time_spent_seconds, timer_started_at, is_recurring, recurring_rule, created_at, updated_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || replace(title, '''', '''''') || ''', ' || COALESCE('''' || replace(description, '''', '''''') || '''', 'NULL') || ', ''' || date || ''', ' || COALESCE('''' || folder_id || '''', 'NULL') || ', ' || COALESCE('''' || status_id || '''', 'NULL') || ', ' || COALESCE(priority::text, '2') || ', ARRAY[' || COALESCE(array_to_string(labels, ','), '') || '], ' || completed || ', ' || COALESCE('''' || completed_at || '''', 'NULL') || ', ' || COALESCE('''' || due_date || '''', 'NULL') || ', ' || COALESCE('''' || start_date || '''', 'NULL') || ', ' || COALESCE(time_estimate_minutes::text, 'NULL') || ', ' || COALESCE(time_spent_seconds::text, '0') || ', ' || COALESCE('''' || timer_started_at || '''', 'NULL') || ', ' || is_recurring || ', ' || COALESCE('''' || recurring_rule || '''', 'NULL') || ', ''' || created_at || ''', ''' || updated_at || ''')' , ',')
FROM public.daily_tasks;

-- 8. task_subtasks (depende de daily_tasks)
SELECT 'INSERT INTO public.task_subtasks (id, task_id, title, completed, order_index, created_at, updated_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || task_id || ''', ''' || replace(title, '''', '''''') || ''', ' || completed || ', ' || order_index || ', ''' || created_at || ''', ''' || updated_at || ''')' , ',')
FROM public.task_subtasks;

-- 9. task_checklists (depende de daily_tasks)
SELECT 'INSERT INTO public.task_checklists (id, task_id, name, order_index, created_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || task_id || ''', ''' || replace(name, '''', '''''') || ''', ' || order_index || ', ''' || created_at || ''')' , ',')
FROM public.task_checklists;

-- 10. task_checklist_items (depende de task_checklists)
SELECT 'INSERT INTO public.task_checklist_items (id, checklist_id, title, completed, order_index, created_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || checklist_id || ''', ''' || replace(title, '''', '''''') || ''', ' || completed || ', ' || order_index || ', ''' || created_at || ''')' , ',')
FROM public.task_checklist_items;

-- 11. calendar_blocks (depende de calendar_blocks para recurrence_parent_id)
SELECT 'INSERT INTO public.calendar_blocks (id, user_id, title, description, start_time, end_time, actual_start_time, actual_end_time, duration_minutes, color, status, priority, demand_type, recurrence_type, recurrence_rule, recurrence_parent_id, recurrence_end_date, is_recurrence_paused, completed_at, created_at, updated_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || replace(title, '''', '''''') || ''', ' || COALESCE('''' || replace(description, '''', '''''') || '''', 'NULL') || ', ''' || start_time || ''', ''' || end_time || ''', ' || COALESCE('''' || actual_start_time || '''', 'NULL') || ', ' || COALESCE('''' || actual_end_time || '''', 'NULL') || ', ' || COALESCE(duration_minutes::text, 'NULL') || ', ''' || color || ''', ''' || status || ''', ''' || priority || ''', ''' || demand_type || ''', ''' || recurrence_type || ''', ' || COALESCE('''' || recurrence_rule || '''', 'NULL') || ', ' || COALESCE('''' || recurrence_parent_id || '''', 'NULL') || ', ' || COALESCE('''' || recurrence_end_date || '''', 'NULL') || ', ' || is_recurrence_paused || ', ' || COALESCE('''' || completed_at || '''', 'NULL') || ', ''' || created_at || ''', ''' || updated_at || ''')' , ',')
FROM public.calendar_blocks;

-- 12. calendar_daily_stats (sem dependências externas)
SELECT 'INSERT INTO public.calendar_daily_stats (id, user_id, date, planned_blocks, completed_blocks, cancelled_blocks, postponed_blocks, planned_time_minutes, actual_time_minutes, execution_score, created_at, updated_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || date || ''', ' || COALESCE(planned_blocks::text, '0') || ', ' || COALESCE(completed_blocks::text, '0') || ', ' || COALESCE(cancelled_blocks::text, '0') || ', ' || COALESCE(postponed_blocks::text, '0') || ', ' || COALESCE(planned_time_minutes::text, '0') || ', ' || COALESCE(actual_time_minutes::text, '0') || ', ' || COALESCE(execution_score::text, '0') || ', ''' || created_at || ''', ''' || updated_at || ''')' , ',')
FROM public.calendar_daily_stats;

-- 13. habits (sem dependências)
SELECT 'INSERT INTO public.habits (id, user_id, name, frequency, start_date, active, created_at, updated_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || replace(name, '''', '''''') || ''', ''' || replace(frequency::text, '''', '''''') || ''', ''' || start_date || ''', ' || active || ', ''' || created_at || ''', ''' || updated_at || ''')' , ',')
FROM public.habits;

-- 14. habit_logs (depende de habits)
SELECT 'INSERT INTO public.habit_logs (id, habit_id, date, status, created_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || habit_id || ''', ''' || date || ''', ''' || status || ''', ''' || created_at || ''')' , ',')
FROM public.habit_logs;

-- 15. consistency_days (sem dependências)
SELECT 'INSERT INTO public.consistency_days (id, user_id, date, is_active, reason, streak_snapshot, created_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || date || ''', ' || is_active || ', ' || COALESCE('''' || reason || '''', 'NULL') || ', ' || COALESCE(streak_snapshot::text, '0') || ', ' || COALESCE('''' || created_at || '''', 'NULL') || ')' , ',')
FROM public.consistency_days;

-- 16. goal_categories (sem dependências)
SELECT 'INSERT INTO public.goal_categories (id, user_id, name, color, icon, is_default, "order", created_at, updated_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || replace(name, '''', '''''') || ''', ''' || color || ''', ''' || icon || ''', ' || is_default || ', ' || COALESCE("order"::text, '0') || ', ''' || created_at || ''', ''' || updated_at || ''')' , ',')
FROM public.goal_categories;

-- 17. goals (depende de goal_categories)
SELECT 'INSERT INTO public.goals (id, user_id, title, description, type, status, category, category_id, start_date, end_date, target_value, current_value, unit_label, created_at, updated_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || replace(title, '''', '''''') || ''', ' || COALESCE('''' || replace(description, '''', '''''') || '''', 'NULL') || ', ''' || type || ''', ''' || status || ''', ' || COALESCE('''' || category || '''', 'NULL') || ', ' || COALESCE('''' || category_id || '''', 'NULL') || ', ''' || start_date || ''', ''' || end_date || ''', ' || target_value || ', ' || current_value || ', ''' || unit_label || ''', ''' || created_at || ''', ''' || updated_at || ''')' , ',')
FROM public.goals;

-- 18. goal_progress_history (depende de goals)
SELECT 'INSERT INTO public.goal_progress_history (id, goal_id, value, note, created_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || goal_id || ''', ' || value || ', ' || COALESCE('''' || replace(note, '''', '''''') || '''', 'NULL') || ', ''' || created_at || ''')' , ',')
FROM public.goal_progress_history;

-- 19. finance_sectors (sem dependências)
SELECT 'INSERT INTO public.finance_sectors (id, user_id, name, icon, color_label, created_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || replace(name, '''', '''''') || ''', ''' || icon || ''', ''' || color_label || ''', ' || COALESCE('''' || created_at || '''', 'NULL') || ')' , ',')
FROM public.finance_sectors;

-- 20. finance_transactions (depende de finance_sectors)
SELECT 'INSERT INTO public.finance_transactions (id, user_id, name, description, value, date, sector_id, status, created_at, updated_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || replace(name, '''', '''''') || ''', ' || COALESCE('''' || replace(description, '''', '''''') || '''', 'NULL') || ', ' || value || ', ''' || date || ''', ' || COALESCE('''' || sector_id || '''', 'NULL') || ', ''' || status || ''', ''' || created_at || ''', ''' || updated_at || ''')' , ',')
FROM public.finance_transactions;

-- 21. nutrition_days (sem dependências)
SELECT 'INSERT INTO public.nutrition_days (id, user_id, date, calories_total, protein_total, carbs_total, fat_total, fiber_total, target_calories, target_protein, target_carbs, target_fat, target_fiber, created_at, updated_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || date || ''', ' || COALESCE(calories_total::text, '0') || ', ' || COALESCE(protein_total::text, '0') || ', ' || COALESCE(carbs_total::text, '0') || ', ' || COALESCE(fat_total::text, '0') || ', ' || COALESCE(fiber_total::text, '0') || ', ' || COALESCE(target_calories::text, 'NULL') || ', ' || COALESCE(target_protein::text, 'NULL') || ', ' || COALESCE(target_carbs::text, 'NULL') || ', ' || COALESCE(target_fat::text, 'NULL') || ', ' || COALESCE(target_fiber::text, 'NULL') || ', ''' || created_at || ''', ''' || updated_at || ''')' , ',')
FROM public.nutrition_days;

-- 22. meals (depende de nutrition_days)
SELECT 'INSERT INTO public.meals (id, user_id, nutrition_day_id, name, created_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || nutrition_day_id || ''', ''' || replace(name, '''', '''''') || ''', ' || COALESCE('''' || created_at || '''', 'NULL') || ')' , ',')
FROM public.meals;

-- 23. food_items (depende de meals)
SELECT 'INSERT INTO public.food_items (id, meal_id, name, quantity_text, calories, protein, carbs, fat, fiber, source, created_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || meal_id || ''', ''' || replace(name, '''', '''''') || ''', ' || COALESCE('''' || quantity_text || '''', 'NULL') || ', ' || COALESCE(calories::text, '0') || ', ' || COALESCE(protein::text, '0') || ', ' || COALESCE(carbs::text, '0') || ', ' || COALESCE(fat::text, '0') || ', ' || COALESCE(fiber::text, '0') || ', ' || COALESCE('''' || source || '''', 'NULL') || ', ' || COALESCE('''' || created_at || '''', 'NULL') || ')' , ',')
FROM public.food_items;

-- 24. exercises (sem dependências)
SELECT 'INSERT INTO public.exercises (id, user_id, name, muscle_group, notes, created_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || replace(name, '''', '''''') || ''', ' || COALESCE('''' || muscle_group || '''', 'NULL') || ', ' || COALESCE('''' || replace(notes, '''', '''''') || '''', 'NULL') || ', ' || COALESCE('''' || created_at || '''', 'NULL') || ')' , ',')
FROM public.exercises;

-- 25. workout_plans (sem dependências)
SELECT 'INSERT INTO public.workout_plans (id, user_id, name, description, created_at, updated_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || replace(name, '''', '''''') || ''', ' || COALESCE('''' || replace(description, '''', '''''') || '''', 'NULL') || ', ''' || created_at || ''', ''' || updated_at || ''')' , ',')
FROM public.workout_plans;

-- 26. workout_sessions (depende de workout_plans)
SELECT 'INSERT INTO public.workout_sessions (id, user_id, plan_id, datetime_start, datetime_end, total_volume, notes, created_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ' || COALESCE('''' || plan_id || '''', 'NULL') || ', ''' || datetime_start || ''', ' || COALESCE('''' || datetime_end || '''', 'NULL') || ', ' || COALESCE(total_volume::text, 'NULL') || ', ' || COALESCE('''' || replace(notes, '''', '''''') || '''', 'NULL') || ', ' || COALESCE('''' || created_at || '''', 'NULL') || ')' , ',')
FROM public.workout_sessions;

-- 27. workout_exercise_entries (depende de workout_sessions e exercises)
SELECT 'INSERT INTO public.workout_exercise_entries (id, session_id, exercise_id, order_index, created_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || session_id || ''', ''' || exercise_id || ''', ' || COALESCE(order_index::text, '0') || ', ' || COALESCE('''' || created_at || '''', 'NULL') || ')' , ',')
FROM public.workout_exercise_entries;

-- 28. workout_sets (depende de workout_exercise_entries)
SELECT 'INSERT INTO public.workout_sets (id, exercise_entry_id, set_number, reps, weight_kg, rpe, rest_seconds_used, technique, completed, created_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || exercise_entry_id || ''', ' || set_number || ', ' || reps || ', ' || weight_kg || ', ' || COALESCE(rpe::text, 'NULL') || ', ' || COALESCE(rest_seconds_used::text, 'NULL') || ', ' || COALESCE('''' || technique || '''', 'NULL') || ', ' || COALESCE(completed::text, 'false') || ', ' || COALESCE('''' || created_at || '''', 'NULL') || ')' , ',')
FROM public.workout_sets;

-- 29. rankings (sem dependências externas)
SELECT 'INSERT INTO public.rankings (id, creator_id, name, description, start_date, end_date, status, max_participants, bet_description, bet_amount, deletion_requested, deletion_requested_at, created_at, updated_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || creator_id || ''', ''' || replace(name, '''', '''''') || ''', ' || COALESCE('''' || replace(description, '''', '''''') || '''', 'NULL') || ', ''' || start_date || ''', ''' || end_date || ''', ''' || status || ''', ' || max_participants || ', ' || COALESCE('''' || replace(bet_description, '''', '''''') || '''', 'NULL') || ', ' || COALESCE('''' || bet_amount || '''', 'NULL') || ', ' || deletion_requested || ', ' || COALESCE('''' || deletion_requested_at || '''', 'NULL') || ', ''' || created_at || ''', ''' || updated_at || ''')' , ',')
FROM public.rankings;

-- 30. ranking_participants (depende de rankings)
SELECT 'INSERT INTO public.ranking_participants (id, ranking_id, user_id, status, total_points, accepted_bet, deletion_consent, joined_at, created_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || ranking_id || ''', ''' || user_id || ''', ''' || status || ''', ' || total_points || ', ' || accepted_bet || ', ' || deletion_consent || ', ' || COALESCE('''' || joined_at || '''', 'NULL') || ', ''' || created_at || ''')' , ',')
FROM public.ranking_participants;

-- 31. ranking_goals (depende de rankings)
SELECT 'INSERT INTO public.ranking_goals (id, ranking_id, title, description, order_index, created_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || ranking_id || ''', ''' || replace(title, '''', '''''') || ''', ' || COALESCE('''' || replace(description, '''', '''''') || '''', 'NULL') || ', ' || order_index || ', ''' || created_at || ''')' , ',')
FROM public.ranking_goals;

-- 32. ranking_goal_logs (depende de rankings e ranking_goals)
SELECT 'INSERT INTO public.ranking_goal_logs (id, ranking_id, goal_id, user_id, date, completed, points_earned, created_at, updated_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || ranking_id || ''', ''' || goal_id || ''', ''' || user_id || ''', ''' || date || ''', ' || completed || ', ' || points_earned || ', ''' || created_at || ''', ''' || updated_at || ''')' , ',')
FROM public.ranking_goal_logs;

-- 33. notifications (sem dependências)
SELECT 'INSERT INTO public.notifications (id, user_id, title, message, type, data, read, created_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || replace(title, '''', '''''') || ''', ''' || replace(message, '''', '''''') || ''', ''' || type || ''', ' || COALESCE('''' || replace(data::text, '''', '''''') || '''', 'NULL') || ', ' || read || ', ''' || created_at || ''')' , ',')
FROM public.notifications;

-- 34. saved_filters (sem dependências)
SELECT 'INSERT INTO public.saved_filters (id, user_id, name, filters, created_at, updated_at) VALUES' ||
  string_agg('(''' || id || ''', ''' || user_id || ''', ''' || replace(name, '''', '''''') || ''', ''' || replace(filters::text, '''', '''''') || ''', ''' || created_at || ''', ''' || updated_at || ''')' , ',')
FROM public.saved_filters;

-- 35. ebook_content (sem dependências externas)
SELECT 'INSERT INTO public.ebook_content (id, user_id, section_key, title, content_markdown, updated_at) VALUES' ||
  string_agg('(''' || id || ''', ' || COALESCE('''' || user_id || '''', 'NULL') || ', ''' || replace(section_key, '''', '''''') || ''', ''' || replace(title, '''', '''''') || ''', ' || COALESCE('''' || replace(content_markdown, '''', '''''') || '''', 'NULL') || ', ' || COALESCE('''' || updated_at || '''', 'NULL') || ')' , ',')
FROM public.ebook_content;

-- ============================================
-- RESUMO
-- ============================================
--
-- Instruções finais:
-- 1. Execute os SELECTs acima em seu banco Lovable Cloud
-- 2. Copie os resultados (os INSERTs gerados)
-- 3. Cole e execute no seu Supabase externo
-- 4. Desabilite temporariamente RLS se tiver problemas ao inserir
-- 5. Re-habilite RLS após a importação completar
--
-- ============================================
