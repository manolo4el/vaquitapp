# VaquitApp

Una aplicación para compartir gastos entre amigos, construida con Next.js, React y Firebase.

## 🚀 Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI**: Tailwind CSS, Radix UI, shadcn/ui
- **Backend**: Firebase (Authentication, Firestore)
- **Deployment**: Vercel
- **Gestión de Estado**: React Context + localStorage

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/manolo4el/vaquitapp.git
cd vaquitapp

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus credenciales de Firebase

# Iniciar servidor de desarrollo
npm run dev
```

## 🔧 Scripts

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## 🔐 Variables de Entorno

Crea un archivo `.env.local` con las siguientes variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

## 🏗️ Estructura del Proyecto

```
vaquitapp/
├── app/                    # Páginas de Next.js 13+ (App Router)
│   ├── dashboard/         # Dashboard principal
│   ├── group/            # Gestión de grupos
│   ├── login/            # Página de login
│   └── profile/          # Perfil de usuario
├── components/           # Componentes reutilizables
│   ├── ui/              # Componentes de UI (shadcn/ui)
│   └── ...              # Componentes específicos
├── hooks/               # Custom hooks
├── lib/                 # Utilidades y configuración
│   ├── auth.ts          # Lógica de autenticación
│   ├── firebase.ts      # Configuración de Firebase
│   └── ...              # Otras utilidades
└── public/              # Archivos estáticos
```

## 🐛 Debugging

### Problemas Comunes

1. **Error de Firebase**: Verifica que las variables de entorno estén configuradas correctamente
2. **Error de build**: Asegúrate de que todas las dependencias estén instaladas
3. **Error de autenticación**: Verifica que el dominio esté autorizado en Firebase Console

### Logs de Debug

La aplicación incluye logs detallados para debugging:
- Autenticación: `console.log` en `lib/auth.ts`
- Estado de usuario: `console.log` en `hooks/use-auth.tsx`

## 🚀 Deployment

### Vercel

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel Dashboard
3. Deploy automático en cada push

### Variables de Entorno en Vercel

Asegúrate de configurar todas las variables de entorno en Vercel Dashboard.

## 📱 Características

- ✅ Autenticación con Google
- ✅ Gestión de grupos de gastos
- ✅ Cálculo automático de deudas
- ✅ Interfaz responsive
- ✅ Tema personalizado
- ✅ Persistencia local

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. 