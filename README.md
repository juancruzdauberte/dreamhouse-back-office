# 🏡 Dreamhouse Back-Office

Un sistema de gestión "back-office" robusto y moderno construido con **Next.js 16**, diseñado para optimizar las reservas de propiedades, gestionar ocupaciones y manejar tareas administrativas con eficiencia y estilo.

Este proyecto demuestra una arquitectura full-stack escalable utilizando **App Router**, **Server Actions** y un estricto **Patrón Repositorio (Repository Pattern)** para el acceso a datos, asegurando la separación de responsabilidades y la seguridad de tipos.

## 🚀 Características Principales

- **Autenticación y Seguridad**: Inicio de sesión seguro vía **NextAuth.js** (Credenciales y Google OAuth).
- **Gestión de Reservas**: Operaciones CRUD completas para reservas de propiedades.
- **Integración Dinámica de Calendario**: Integración con **Google Calendar API** para sincronizar reservas.
- **Generación de PDF**: Generación automatizada de facturas y contratos en PDF usando `@react-pdf/renderer` y `html2pdf.js`.
- **Interfaz Interactiva**: Diseño responsivo con **Tailwind CSS v4**, presentando formularios interactivos, selectores de fecha y notificaciones toast.
- **Gestión de Estado**: Estado del lado del cliente optimizado usando **Zustand**.
- **Validación de Datos**: Validación de esquemas estricta con **Zod** tanto para la API como para formularios del cliente.

## 🛠 Tech Stack (Tecnologías)

### Core

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Librería**: [React 19](https://react.dev/)

### Estilos y UI

- **Tailwind CSS v4**: Framework CSS utility-first para desarrollo rápido de UI.
- **Lucide React**: Iconos hermosos y consistentes.
- **React Datepicker**: Selección de fechas amigable.
- **React Toastify**: Notificaciones elegantes.

### Backend y Base de Datos

- **MySQL**: Base de datos relacional para datos estructurados.
- **MySQL2**: Driver rápido de node.js para MySQL.
- **Patrón Repositorio**: Capa de acceso a datos abstraída para mantenibilidad.
- **Server Actions**: Llamadas directas a la lógica del backend desde componentes.

### Utilidades

- **Zod**: Declaración y validación de esquemas first-class en TypeScript.
- **Google APIs**: Integración con servicios de Google.

## 🏗 Arquitectura

Este proyecto sigue una arquitectura modular enfatizando la separación de responsabilidades:

- **`app/`**: Estructura del App Router de Next.js.
  - **`(pages)`**: Grupos de rutas para una estructura de páginas organizada.
  - **`api/`**: Manejadores de rutas API para integraciones externas.
  - **`components/`**: Componentes de UI reutilizables.
  - **`lib/`**: Lógica de negocio core y utilidades.
    - **`repository/`**: Capa de acceso a datos (Patrón Repositorio) aislando la lógica de base de datos.
    - **`actions/`**: Server Actions para manejar envíos de formularios y mutaciones de datos.
- **`providers/`**: Proveedores de contexto (Session, Toast, etc.).
- **`store/`**: Stores de gestión de estado global (Zustand).

### Implementación del Patrón Repositorio

Utilizamos el Patrón Repositorio para desacoplar la lógica de negocio de la implementación de la base de datos. Esto permite pruebas más fáciles y potenciales cambios futuros de base de datos sin afectar la lógica central de la aplicación.
