export type Lang = "es" | "en";

export const translations = {
  // Brand & nav
  app_tagline: { es: "Tu dinero, con más claridad", en: "Your money, with clarity" },
  nav_dashboard: { es: "Inicio", en: "Dashboard" },
  nav_insights: { es: "Análisis", en: "Insights" },
  nav_history: { es: "Historial", en: "History" },
  add_expense: { es: "Agregar gasto", en: "Add expense" },

  // Dashboard
  this_month: { es: "Este mes", en: "This month" },
  today: { es: "Hoy", en: "Today" },
  today_is: { es: "Hoy es", en: "Today is" },
  entries_this_month: { es: "Registros este mes", en: "Entries this month" },
  avg_per_entry: { es: "Promedio por registro", en: "Avg / entry" },
  recent: { es: "Recientes", en: "Recent" },
  see_all: { es: "Ver todo", en: "See all" },
  deeper_insights: { es: "Análisis detallado", en: "Deeper insights" },

  // Insights
  insights: { es: "Análisis", en: "Insights" },
  insights_title: { es: "Tu dinero, observado con calma", en: "Your money, gently observed" },
  insights_subtitle: { es: "Patrones y tendencias de tus gastos — sin juicios, solo una imagen más clara.", en: "Patterns and trends from your spending — no judgment, just a clearer picture." },
  at_a_glance: { es: "De un vistazo", en: "At a glance" },
  daily_average: { es: "Promedio diario", en: "Daily average" },
  active_days: { es: "Días activos", en: "Active days" },
  top_category: { es: "Categoría principal", en: "Top category" },
  largest_expense: { es: "Mayor gasto", en: "Largest expense" },
  monthly_trend: { es: "Tendencia mensual", en: "Monthly trend" },
  trend_empty: { es: "Agrega gastos para ver tu tendencia.", en: "Add expenses to see your trend." },

  // History
  history: { es: "Historial", en: "History" },
  all_expenses: { es: "Todos los gastos", en: "All expenses" },
  filtered_total: { es: "Total filtrado", en: "Filtered total" },
  search_notes: { es: "Buscar en notas...", en: "Search notes..." },
  all: { es: "Todas", en: "All" },

  // Form
  quick_add: { es: "Agregar gasto", en: "Add expense" },
  category: { es: "Categoría", en: "Category" },
  optional_note: { es: "Nota opcional (ej. café con mamá)", en: "Optional note (e.g. coffee with mom)" },
  saving: { es: "Guardando...", en: "Saving..." },
  cancel: { es: "Cancelar", en: "Cancel" },
  save: { es: "Guardar", en: "Save" },

  // Toasts
  logged: { es: "Registrado ✨", en: "Logged ✨" },
  invalid_amount: { es: "Ingresa un monto válido", en: "Enter a valid amount" },
  save_error: { es: "No se pudo guardar. Intenta de nuevo.", en: "Couldn't save. Try again." },
  load_error: { es: "No se pudieron cargar los gastos", en: "Couldn't load expenses" },
  delete_error: { es: "No se pudo eliminar", en: "Couldn't delete" },
  removed: { es: "Eliminado", en: "Removed" },

  // Lists / empty
  empty_title: { es: "Aquí no hay nada todavía", en: "Nothing here yet" },
  empty_sub: { es: "Agrega tu primer gasto para empezar.", en: "Add your first expense to get started." },
  yesterday: { es: "Ayer", en: "Yesterday" },
  today_label: { es: "Hoy", en: "Today" },

  // Breakdown
  where_it_goes: { es: "A dónde va", en: "Where it goes" },
  breakdown_empty: { es: "El desglose aparecerá cuando registres gastos.", en: "A breakdown will appear once you log expenses." },

  // AI
  ai_insight: { es: "Análisis IA", en: "AI insight" },
  ai_thinking: { es: "Pensando...", en: "Thinking..." },
  ai_error: { es: "No se pudo obtener el análisis ahora.", en: "Couldn't fetch insight right now." },
  ai_empty: { es: "Registra tu primer gasto y empezaré a notar patrones.", en: "Log your first expense and I'll start spotting patterns." },
  ai_refresh_hint: { es: "Toca actualizar para un análisis.", en: "Tap refresh for an insight." },

  // Categories
  cat_food: { es: "Comida", en: "Food" },
  cat_transport: { es: "Transporte", en: "Transport" },
  cat_shopping: { es: "Compras", en: "Shopping" },
  cat_bills: { es: "Facturas", en: "Bills" },
  cat_fun: { es: "Diversión", en: "Fun" },
  cat_health: { es: "Salud", en: "Health" },
  cat_home: { es: "Hogar", en: "Home" },
  cat_other: { es: "Otros", en: "Other" },

  // Language switcher
  language: { es: "Idioma", en: "Language" },

  // Date filter / grouping
  date: { es: "Fecha", en: "Date" },
  pick_date: { es: "Elegir fecha", en: "Pick a date" },
  date_range: { es: "Rango de fechas", en: "Date range" },
  from: { es: "Desde", en: "From" },
  to: { es: "Hasta", en: "To" },
  clear: { es: "Limpiar", en: "Clear" },
  all_dates: { es: "Todas las fechas", en: "All dates" },
  group_by_date: { es: "Por fecha", en: "By date" },
  group_by_category: { es: "Por categoría", en: "By category" },
  preset_today: { es: "Hoy", en: "Today" },
  preset_7d: { es: "Últimos 7 días", en: "Last 7 days" },
  preset_30d: { es: "Últimos 30 días", en: "Last 30 days" },
  preset_month: { es: "Este mes", en: "This month" },
  no_results: { es: "Sin resultados con esos filtros.", en: "No results with these filters." },

  // Auth
  auth_signin_title: { es: "Bienvenido de vuelta", en: "Welcome back" },
  auth_signup_title: { es: "Crea tu cuenta", en: "Create your account" },
  auth_signin_sub: { es: "Inicia sesión para seguir cuidando tu dinero.", en: "Sign in to keep tabs on your money." },
  auth_signup_sub: { es: "Empieza a registrar tus gastos en segundos.", en: "Start logging your expenses in seconds." },
  auth_email: { es: "Correo electrónico", en: "Email" },
  auth_password: { es: "Contraseña", en: "Password" },
  auth_password_hint: { es: "Mínimo 8 caracteres.", en: "At least 8 characters." },
  auth_signin_cta: { es: "Iniciar sesión", en: "Sign in" },
  auth_signup_cta: { es: "Crear cuenta", en: "Sign up" },
  auth_google: { es: "Continuar con Google", en: "Continue with Google" },
  auth_or: { es: "o", en: "or" },
  auth_no_account: { es: "¿No tienes cuenta?", en: "Don't have an account?" },
  auth_have_account: { es: "¿Ya tienes cuenta?", en: "Already have an account?" },
  auth_invalid: { es: "Revisa tu correo y contraseña (mín. 8 caracteres).", en: "Check your email and password (min. 8 chars)." },
  auth_welcome: { es: "¡Bienvenido! Sesión iniciada.", en: "Welcome! You're signed in." },
  auth_already: { es: "Ese correo ya está registrado. Inicia sesión.", en: "That email is already registered. Sign in instead." },
  auth_bad_creds: { es: "Correo o contraseña incorrectos.", en: "Wrong email or password." },
  sign_out: { es: "Cerrar sesión", en: "Sign out" },
  auto_detected: { es: "Detectado", en: "Auto-detected" },

  // Dashboard analytics
  total_spending: { es: "Gasto total", en: "Total spending" },
  daily_average_short: { es: "Promedio diario", en: "Daily average" },
  most_used_category: { es: "Categoría más usada", en: "Most used category" },
  spending_by_category: { es: "Gasto por categoría", en: "Spending by category" },
  smart_insight: { es: "Análisis inteligente", en: "Smart Insight" },
  no_category_yet: { es: "Aún no hay datos", en: "No data yet" },

  // Tone
  tone: { es: "Tono", en: "Tone" },
  tone_soft: { es: "Suave", en: "Soft" },
  tone_neutral: { es: "Neutral", en: "Neutral" },
  tone_brutal: { es: "Brutal", en: "Brutal" },
  tone_soft_desc: { es: "Cálido y alentador", en: "Warm and supportive" },
  tone_neutral_desc: { es: "Claro e informativo", en: "Clear and informative" },
  tone_brutal_desc: { es: "Directo, con sarcasmo suave", en: "Direct, lightly sarcastic" },

  // Notifications
  notifications: { es: "Notificaciones", en: "Notifications" },
  notif_empty: { es: "Sin avisos por ahora. Todo en orden.", en: "No alerts right now. All clear." },
  notif_dismiss: { es: "Descartar", en: "Dismiss" },
  notif_dismiss_all: { es: "Descartar todo", en: "Dismiss all" },
  notif_no_log_title: { es: "Aún no registras hoy", en: "No expenses logged today" },
  notif_no_log_body: { es: "Toma 5 segundos y anota tu último gasto antes de que se te olvide.", en: "Take 5 seconds and jot down your latest spend before it slips away." },
  notif_weekly_spike_title: { es: "Semana más cara de lo normal", en: "Spending up this week" },
  notif_weekly_spike_body: { es: "Llevas {amount} esta semana, {pct} arriba de tu promedio.", en: "You're at {amount} this week — {pct} above your usual." },
  notif_cat_spike_title: { es: "Una categoría se disparó", en: "One category is climbing" },
  notif_cat_spike_body: { es: "{category} subió {pct} vs la semana pasada.", en: "{category} is up {pct} vs last week." },
  notif_outlier_title: { es: "Gasto grande detectado", en: "Big expense spotted" },
  notif_outlier_body: { es: "{amount} en {category} pesa bastante en tu semana.", en: "{amount} on {category} is a big chunk of your week." },
  notif_streak_title: { es: "Buen comienzo", en: "Nice start" },
  notif_streak_body: { es: "Registra otro gasto para empezar a ver patrones.", en: "Log another expense and patterns will start showing up." },

  // Projection
  projection_title: { es: "Proyección del mes", en: "Month projection" },
  projection_body: { es: "A este ritmo, gastarás {amount} este mes.", en: "At this pace, you will spend {amount} this month." },
  projection_detail: { es: "Promedio diario {daily} · {days} días restantes", en: "Daily avg {daily} · {days} days left" },
  projection_empty: { es: "Registra un gasto para ver tu proyección.", en: "Log an expense to see your projection." },
  pace_calm: { es: "En calma", en: "On track" },
  pace_watch: { es: "Atento", en: "Watch" },
  pace_over: { es: "Pasado", en: "Over" },

  // Biggest money leak
  leak_label: { es: "Mayor fuga de dinero", en: "Biggest money leak" },
  leak_body: { es: "Tu mayor fuga de dinero es: {category}", en: "Your biggest money leak is: {category}" },
  leak_detail: { es: "{amount} este mes · {pct} del total", en: "{amount} this month · {pct} of total" },
  leak_empty: { es: "Registra gastos para descubrir tu mayor fuga.", en: "Log expenses to spot your biggest leak." },

  // Income
  nav_income: { es: "Ingresos", en: "Income" },
  income: { es: "Ingreso", en: "Income" },
  incomes: { es: "Ingresos", en: "Income" },
  add_income: { es: "Agregar ingreso", en: "Add income" },
  edit_income: { es: "Editar ingreso", en: "Edit income" },
  income_amount: { es: "Monto", en: "Amount" },
  income_source: { es: "Fuente", en: "Source" },
  income_description: { es: "Descripción", en: "Description" },
  income_date: { es: "Fecha", en: "Date" },
  income_logged: { es: "Ingreso registrado ✨", en: "Income logged ✨" },
  income_updated: { es: "Ingreso actualizado", en: "Income updated" },
  income_removed: { es: "Ingreso eliminado", en: "Income removed" },
  income_empty: { es: "Aún no registras ingresos. Agrega el primero.", en: "No income logged yet. Add your first one." },
  income_history: { es: "Historial de ingresos", en: "Income history" },
  src_salary: { es: "Salario", en: "Salary" },
  src_freelance: { es: "Freelance", en: "Freelance" },
  src_business: { es: "Negocio", en: "Business" },
  src_investment: { es: "Inversión", en: "Investment" },
  src_gift: { es: "Regalo", en: "Gift" },
  src_other: { es: "Otro", en: "Other" },

  // Balance
  balance_title: { es: "Balance del mes", en: "Monthly balance" },
  balance_income: { es: "Ingresos", en: "Income" },
  balance_expenses: { es: "Gastos", en: "Expenses" },
  balance_net: { es: "Balance neto", en: "Net balance" },
  balance_saving: { es: "Este mes estás ahorrando", en: "You are saving this month" },
  balance_overspending: { es: "Este mes estás gastando más de lo que ganas", en: "You are spending more than you earn" },
  balance_neutral: { es: "Aún sin movimiento este mes", en: "No activity yet this month" },

  // CRUD / actions
  edit: { es: "Editar", en: "Edit" },
  delete: { es: "Eliminar", en: "Delete" },
  edit_expense: { es: "Editar gasto", en: "Edit expense" },
  expense_updated: { es: "Gasto actualizado", en: "Expense updated" },
  confirm_delete_title: { es: "¿Eliminar este registro?", en: "Delete this entry?" },
  confirm_delete_desc: { es: "Esta acción no se puede deshacer.", en: "This action cannot be undone." },

  // Unified history
  filter_type: { es: "Tipo", en: "Type" },
  type_all: { es: "Todo", en: "All" },
  type_expenses: { es: "Gastos", en: "Expenses" },
  type_income: { es: "Ingresos", en: "Income" },
  unified_title: { es: "Movimientos", en: "Transactions" },
  description_label: { es: "Descripción", en: "Description" },
  amount_label: { es: "Monto", en: "Amount" },

  // Monthly view
  nav_monthly: { es: "Mensual", en: "Monthly" },
  monthly_title: { es: "Resumen mensual", en: "Monthly overview" },
  monthly_subtitle: { es: "Tu dinero, mes a mes — ingresos, gastos y balance neto.", en: "Your money, month by month — income, expenses, and net balance." },
  monthly_empty: { es: "Aún no hay movimientos. Agrega un gasto o ingreso para empezar.", en: "No activity yet. Add an expense or income to get started." },
  monthly_no_transactions: { es: "Sin movimientos en este mes.", en: "No transactions this month." },
  monthly_show_transactions: { es: "Ver movimientos", en: "Show transactions" },
  monthly_hide_transactions: { es: "Ocultar movimientos", en: "Hide transactions" },
  monthly_transactions_count: { es: "{count} movimientos", en: "{count} transactions" },
  monthly_positive: { es: "Gastaste menos de lo que ganaste", en: "You spent less than you earned" },
  monthly_negative: { es: "Gastaste más de lo que ganaste", en: "You spent more than you earned" },
  monthly_even: { es: "Equilibrio total este mes", en: "Perfectly even this month" },
  monthly_no_income: { es: "Mes sin ingresos registrados", en: "No income recorded this month" },
  monthly_compare_spent_more: { es: "Gastaste {pct} más que el mes anterior", en: "You spent {pct} more than last month" },
  monthly_compare_spent_less: { es: "Gastaste {pct} menos que el mes anterior", en: "You spent {pct} less than last month" },
  monthly_compare_saved_more: { es: "Ahorraste {pct} más que el mes anterior", en: "You saved {pct} more than last month" },
  monthly_compare_saved_less: { es: "Ahorraste {pct} menos que el mes anterior", en: "You saved {pct} less than last month" },
  monthly_compare_first: { es: "Tu primer mes con actividad", en: "Your first month of activity" },

  // Device security
  new_device_detected: {
    es: "Detectamos un nuevo dispositivo. Por seguridad, inicia sesión nuevamente.",
    en: "We detected a new device. Please log in again for security.",
  },

  // Categories management
  nav_categories: { es: "Categorías", en: "Categories" },
  cat_manage_title: { es: "Tus categorías", en: "Your categories" },
  cat_manage_subtitle: {
    es: "Crea, edita y elimina las categorías que usas para organizar tus gastos.",
    en: "Create, edit and remove the categories you use to organize your spending.",
  },
  cat_new: { es: "Nueva", en: "New" },
  cat_new_title: { es: "Nueva categoría", en: "New category" },
  cat_edit_title: { es: "Editar categoría", en: "Edit category" },
  cat_name: { es: "Nombre", en: "Name" },
  cat_name_placeholder: { es: "Ej. Café", en: "e.g. Coffee" },
  cat_name_required: { es: "Ponle un nombre a la categoría", en: "Give the category a name" },
  cat_icon: { es: "Icono", en: "Icon" },
  cat_color: { es: "Color", en: "Color" },
  cat_empty: { es: "Aún no tienes categorías. Crea la primera.", en: "No categories yet. Create your first one." },
  cat_expenses_using: { es: "gastos", en: "expenses" },
  cat_created: { es: "Categoría creada ✨", en: "Category created ✨" },
  cat_updated: { es: "Categoría actualizada", en: "Category updated" },
  cat_deleted: { es: "Categoría eliminada", en: "Category deleted" },
  cat_delete_title: { es: "Eliminar", en: "Delete" },
  cat_delete_safe: {
    es: "Esta categoría no tiene gastos asociados. Se eliminará de forma permanente.",
    en: "This category has no linked expenses. It will be permanently removed.",
  },
  cat_delete_has_expenses: {
    es: "Esta categoría tiene {n} gastos. Elige qué hacer con ellos.",
    en: "This category has {n} expenses. Choose what to do with them.",
  },
  cat_delete_reassign: { es: "Mover los gastos a otra categoría", en: "Move expenses to another category" },
  cat_delete_block: { es: "No eliminar (cancelar)", en: "Don't delete (cancel)" },
  cat_delete_blocked: { es: "Hay gastos asociados a esta categoría.", en: "There are expenses linked to this category." },

  // Global search
  nav_search: { es: "Buscar", en: "Search" },
  search_title: { es: "Buscar movimientos", en: "Search transactions" },
  search_subtitle: {
    es: "Encuentra cualquier gasto o ingreso por descripción, categoría, fuente o monto.",
    en: "Find any expense or income by description, category, source, or amount.",
  },
  search_placeholder: { es: "Buscar gastos o ingresos...", en: "Search expenses or income..." },
  search_min: { es: "Mín", en: "Min" },
  search_max: { es: "Máx", en: "Max" },
  search_count: { es: "Resultados", en: "Results" },
  search_total_spent: { es: "Total gastado", en: "Total spent" },
  search_average: { es: "Promedio", en: "Average" },
  search_top_category: { es: "Categoría principal", en: "Top category" },
  search_empty_title: { es: "No se encontraron resultados", en: "No results found" },
  search_empty_sub: {
    es: "Prueba con otra palabra clave o ajusta los filtros.",
    en: "Try a different keyword or adjust the filters.",
  },
  search_semantic_hint: {
    es: "Búsqueda inteligente activada — encuentra por significado.",
    en: "Smart search enabled — find by meaning.",
  },
  search_semantic_badge: { es: "Similar", en: "Similar" },

  // Bulk selection
  bulk_select: { es: "Seleccionar", en: "Select" },
  bulk_selected_count: { es: "{n} seleccionados", en: "{n} selected" },
  bulk_select_all: { es: "Seleccionar todo", en: "Select all" },
  bulk_deselect_all: { es: "Deseleccionar todo", en: "Deselect all" },
  bulk_delete: { es: "Eliminar seleccionados", en: "Delete selected" },
  bulk_delete_confirm_title: {
    es: "¿Eliminar {n} registros?",
    en: "Delete {n} records?",
  },
  bulk_delete_confirm_desc: {
    es: "Se moverán a la Papelera y podrás restaurarlos durante 30 días.",
    en: "They will be moved to Trash and can be restored within 30 days.",
  },
  bulk_deleted_toast: { es: "{n} movidos a la papelera", en: "{n} moved to Trash" },

  // Trash
  nav_trash: { es: "Papelera", en: "Trash" },
  trash_title: { es: "Papelera", en: "Trash" },
  trash_subtitle: {
    es: "Los registros se eliminan permanentemente después de 30 días.",
    en: "Records are permanently deleted after 30 days.",
  },
  trash_empty: { es: "La papelera está vacía.", en: "Trash is empty." },
  trash_deleted_on: { es: "Eliminado", en: "Deleted" },
  trash_days_left: { es: "{n} días restantes", en: "{n} days left" },
  trash_restore: { es: "Restaurar", en: "Restore" },
  trash_delete_forever: { es: "Eliminar definitivamente", en: "Delete permanently" },
  trash_empty_all: { es: "Vaciar papelera", en: "Empty trash" },
  trash_restored_toast: { es: "Registros restaurados", en: "Records restored" },
  trash_purged_toast: { es: "Eliminados definitivamente", en: "Permanently deleted" },
  trash_purge_confirm_title: {
    es: "¿Eliminar definitivamente {n} registros?",
    en: "Permanently delete {n} records?",
  },
  trash_purge_confirm_desc: {
    es: "Esta acción no se puede deshacer.",
    en: "This action cannot be undone.",
  },
} as const;

export type TKey = keyof typeof translations;

export const t = (key: TKey, lang: Lang): string => {
  const entry = translations[key];
  return entry?.[lang] ?? key;
};
