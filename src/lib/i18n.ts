export type Lang = "es" | "en";

export const translations = {
  // Brand & nav
  app_tagline: { es: "Una forma más amable de cuidar tu dinero — registra rápido, aprende con calma.", en: "A friendlier way to keep tabs on your money — log fast, learn gently." },
  nav_dashboard: { es: "Inicio", en: "Dashboard" },
  nav_insights: { es: "Análisis", en: "Insights" },
  nav_history: { es: "Historial", en: "History" },
  add_expense: { es: "Agregar gasto", en: "Add expense" },

  // Dashboard
  this_month: { es: "Este mes", en: "This month" },
  today: { es: "Hoy", en: "Today" },
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
  quick_add: { es: "Agregar rápido", en: "Quick add" },
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
} as const;

export type TKey = keyof typeof translations;

export const t = (key: TKey, lang: Lang): string => {
  const entry = translations[key];
  return entry?.[lang] ?? key;
};
